import { prisma } from "../lib/prisma";
import type { Beach, Forecast, Prisma } from "@prisma/client";

export class ScoreService {
  // Direction mapping utilities
  private static cardinalToDegreesMap: Record<string, number> = {
    N: 0,
    NNE: 22.5,
    NE: 45,
    ENE: 67.5,
    E: 90,
    ESE: 112.5,
    SE: 135,
    SSE: 157.5,
    S: 180,
    SSW: 202.5,
    SW: 225,
    WSW: 247.5,
    W: 270,
    WNW: 292.5,
    NW: 315,
    NNW: 337.5,
  };

  private static degreesToCardinal(degrees: number): string {
    try {
      if (typeof degrees !== "number" || isNaN(degrees)) return "NA";
      degrees = degrees % 360;
      if (degrees < 0) degrees += 360;

      const cardinals = Object.entries(this.cardinalToDegreesMap);
      return cardinals.reduce((closest, [direction, dirDegrees]) => {
        const currentDiff = Math.abs(degrees - dirDegrees);
        const closestDiff = Math.abs(
          degrees - this.cardinalToDegreesMap[closest]
        );
        return currentDiff < closestDiff ? direction : closest;
      }, "N");
    } catch (error) {
      console.error("Error converting degrees to cardinal:", error);
      return "NA";
    }
  }

  /**
   * Calculate score for a single beach
   */
  static calculateScore(
    beach: Beach,
    conditions: Pick<
      Forecast,
      | "windSpeed"
      | "windDirection"
      | "swellHeight"
      | "swellDirection"
      | "swellPeriod"
    >
  ): number | null {
    try {
      const parsedBeach = {
        ...beach,
        optimalSwellDirections:
          typeof beach.optimalSwellDirections === "string"
            ? JSON.parse(beach.optimalSwellDirections)
            : beach.optimalSwellDirections,
        swellSize:
          typeof beach.swellSize === "string"
            ? JSON.parse(beach.swellSize)
            : beach.swellSize,
        idealSwellPeriod:
          typeof beach.idealSwellPeriod === "string"
            ? JSON.parse(beach.idealSwellPeriod)
            : beach.idealSwellPeriod,
      };

      let score = 5;
      const deductions: any[] = [];

      // Wind direction scoring
      const windCardinal = this.degreesToCardinal(conditions.windDirection);

      if (!beach.optimalWindDirections.includes(windCardinal)) {
        const minAngleDiff = beach.optimalWindDirections.reduce(
          (minDiff, optimalDir) => {
            const optimalDegrees = this.cardinalToDegreesMap[optimalDir];
            const diff = Math.abs(conditions.windDirection - optimalDegrees);
            const angleDiff = Math.min(diff, 360 - diff);
            return Math.min(minDiff, angleDiff);
          },
          180
        );

        if (minAngleDiff <= 22.5) {
          score -= 0.5; // Fixed: was adding 0.5, should subtract
        } else if (minAngleDiff <= 45) {
          score -= 1;
        } else if (minAngleDiff <= 90) {
          score -= 2;
        } else {
          score -= 3;
        }
      }

      // Wind strength scoring
      if (!beach.sheltered) {
        if (conditions.windSpeed > 35) {
          score -= 2;
        } else if (conditions.windSpeed > 25) {
          score -= 1.5;
        }
      }

      // Wave size scoring
      if (
        !(
          conditions.swellHeight >= parsedBeach.swellSize.min &&
          conditions.swellHeight <= parsedBeach.swellSize.max
        )
      ) {
        const heightDiff = Math.min(
          Math.abs(conditions.swellHeight - parsedBeach.swellSize.min),
          Math.abs(conditions.swellHeight - parsedBeach.swellSize.max)
        );
        if (heightDiff <= 0.5) {
          score -= 0.5;
        } else if (heightDiff <= 1) {
          score -= 1;
        } else {
          score -= 3;
        }
      }

      // Swell direction scoring
      if (
        !(
          conditions.swellDirection >= parsedBeach.optimalSwellDirections.min &&
          conditions.swellDirection <= parsedBeach.optimalSwellDirections.max
        )
      ) {
        // Calculate minimum angle difference considering wrap-around (0° = 360°)
        const minDiff = Math.abs(
          conditions.swellDirection - parsedBeach.optimalSwellDirections.min
        );
        const maxDiff = Math.abs(
          conditions.swellDirection - parsedBeach.optimalSwellDirections.max
        );
        // Consider wrap-around for both differences
        const minDiffWrapped = Math.min(minDiff, 360 - minDiff);
        const maxDiffWrapped = Math.min(maxDiff, 360 - maxDiff);
        const swellDirDiff = Math.min(minDiffWrapped, maxDiffWrapped);

        if (swellDirDiff <= 20) {
          score -= 1;
        } else if (swellDirDiff <= 45) {
          score -= 2;
        } else {
          score -= 3;
        }
      }

      // Swell period scoring
      if (
        !(
          conditions.swellPeriod >= parsedBeach.idealSwellPeriod.min &&
          conditions.swellPeriod <= parsedBeach.idealSwellPeriod.max
        )
      ) {
        const periodDiff = Math.min(
          Math.abs(conditions.swellPeriod - parsedBeach.idealSwellPeriod.min),
          Math.abs(conditions.swellPeriod - parsedBeach.idealSwellPeriod.max)
        );
        if (periodDiff <= 2) {
          score -= 0.5;
        } else {
          score -= 1;
        }
      }

      const finalScore = Math.min(5, Math.max(0, score));
      return Number(finalScore.toFixed(1));
    } catch (error) {
      console.error("Error calculating beach score:", error);
      return 0;
    }
  }

  /**
   * Calculate and store scores for beaches in a region
   */
  static async calculateAndStoreScores(
    regionId: string,
    forecastData: Pick<
      Forecast,
      | "windSpeed"
      | "windDirection"
      | "swellHeight"
      | "swellDirection"
      | "swellPeriod"
      | "date"
    >
  ) {
    let beaches: Beach[] = [];
    let scores: any[] = [];

    try {
      beaches = await prisma.beach.findMany({
        where: { regionId },
      });

      console.log(`Found ${beaches.length} beaches for region ${regionId}`);

      scores = beaches.map((beach) => {
        const calculatedScore = this.calculateScore(beach, forecastData);

        // Convert score to integer 0-10 by multiplying by 2 and rounding
        const integerScore =
          calculatedScore === null ? 0 : Math.round(calculatedScore * 2);

        // Calculate star rating (1-5) from score (0-10)
        const scoreOutOfFive = Math.floor(integerScore / 2);
        const starRating = Math.max(1, Math.min(5, scoreOutOfFive));

        return {
          beachId: beach.id,
          regionId,
          score: integerScore,
          starRating: starRating,
          date: forecastData.date,
          conditions: {
            windSpeed: forecastData.windSpeed,
            windDirection: forecastData.windDirection,
            swellHeight: forecastData.swellHeight,
            swellDirection: forecastData.swellDirection,
            swellPeriod: forecastData.swellPeriod,
          },
        };
      });

      console.log(
        `Attempting to upsert ${scores.length} scores for date ${forecastData.date}`
      );

      // Delete existing scores for this region and date
      const deleteResult = await prisma.beachDailyScore.deleteMany({
        where: {
          regionId,
          date: forecastData.date,
        },
      });

      console.log(`Deleted ${deleteResult.count} existing scores`);

      // Bulk insert all new scores
      const createResult = await prisma.beachDailyScore.createMany({
        data: scores,
        skipDuplicates: true,
      });

      console.log(
        `Successfully created ${createResult.count} scores for region ${regionId}`
      );

      return scores;
    } catch (error) {
      console.error(
        `Failed to calculate/store scores for region ${regionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get stored scores for a specific date and region
   */
  static async getScores(regionId: string, date: Date) {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    return prisma.beachDailyScore.findMany({
      where: {
        regionId,
        date: normalizedDate,
      },
      include: {
        beach: true,
      },
    });
  }

  /**
   * Get region counts for beaches scoring 4 or higher (score >= 8)
   */
  static async getRegionCounts(date: Date) {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const regionCounts = await prisma.beachDailyScore.groupBy({
      by: ["regionId"],
      where: {
        date: normalizedDate,
        score: { gte: 8 },
      },
      _count: {
        beachId: true,
      },
    });

    return regionCounts.reduce(
      (acc, { regionId, _count }) => ({
        ...acc,
        [regionId]: _count.beachId,
      }),
      {} as Record<string, number>
    );
  }

  /**
   * Get beaches with scores and filters
   */
  static async getBeachesWithScores({
    regionId,
    date,
    searchQuery,
    filters = {},
  }: {
    regionId: string;
    date: Date;
    searchQuery?: string;
    filters?: Partial<{
      difficulty?: string[];
      waveType?: string[];
      crimeLevel?: string[];
      bestSeasons?: string[];
      hazards?: string[];
      bestMonthOfYear?: string[];
      sharkAttack?: string[];
      isHiddenGem?: boolean;
    }>;
  }) {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const whereClause: Prisma.BeachWhereInput = {
      regionId,
      ...(searchQuery
        ? {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              {
                region: {
                  name: { contains: searchQuery, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
      ...Object.entries(filters).reduce(
        (acc: Prisma.BeachWhereInput, [key, value]) => {
          if (value) {
            if (Array.isArray(value)) {
              // Handle enum case conversion for specific fields
              if (
                [
                  "bestSeasons",
                  "waveType",
                  "difficulty",
                  "crimeLevel",
                ].includes(key)
              ) {
                (acc as any)[key] = { in: value.map((v) => v.toUpperCase()) };
              } else {
                (acc as any)[key] = { in: value };
              }
            } else if (typeof value === "boolean") {
              (acc as any)[key] = value;
            }
          }
          return acc;
        },
        {} as Prisma.BeachWhereInput
      ),
    };

    // Get ALL beaches with their scores in a single query
    const beachesWithScores = await prisma.beach.findMany({
      where: whereClause,
      include: {
        beachDailyScores: {
          where: {
            date: normalizedDate,
            regionId,
          },
          orderBy: {
            score: "desc",
          },
          take: 1,
        },
        region: true,
      },
    });

    // Sort ALL beaches by their score
    const sortedBeaches = beachesWithScores.sort(
      (a, b) =>
        (Number(b.beachDailyScores[0]?.score) || 0) -
        (Number(a.beachDailyScores[0]?.score) || 0)
    );

    // Create scores map for ALL beaches
    const scores = Object.fromEntries(
      sortedBeaches.map((beach) => [
        beach.id,
        {
          score: beach.beachDailyScores[0]?.score ?? 0,
          beach: beach,
        },
      ])
    );

    return {
      scores,
      beaches: sortedBeaches,
      totalCount: sortedBeaches.length,
    };
  }
}
