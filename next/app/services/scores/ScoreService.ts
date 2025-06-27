import { prisma } from "@/app/lib/prisma";
import { CoreForecastData } from "@/app/types/forecast";
import type { Beach, ForecastA } from "@prisma/client";

interface PaginationParams {
  regionId: string;
  date: Date;
  page: number;
  limit: number;
}

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
      ForecastA,
      | "windSpeed"
      | "windDirection"
      | "swellHeight"
      | "swellDirection"
      | "swellPeriod"
    >
  ): number {
    try {
      console.log("Starting score calculation for beach:", {
        beachId: beach.id,
        beachName: beach.name,
        input: {
          conditions,
          beach: {
            optimalWindDirections: beach.optimalWindDirections,
            optimalSwellDirections: beach.optimalSwellDirections,
            swellSize: beach.swellSize,
            idealSwellPeriod: beach.idealSwellPeriod,
          },
        },
      });

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

      console.log("Parsed beach data:", {
        beachId: beach.id,
        parsedData: {
          optimalSwellDirections: parsedBeach.optimalSwellDirections,
          swellSize: parsedBeach.swellSize,
          idealSwellPeriod: parsedBeach.idealSwellPeriod,
        },
      });

      let score = 5;
      const deductions = [];

      // Wind direction scoring
      const windCardinal = this.degreesToCardinal(conditions.windDirection);
      console.log("Wind direction check:", {
        current: conditions.windDirection,
        cardinal: windCardinal,
        optimal: beach.optimalWindDirections,
        isOptimal: beach.optimalWindDirections.includes(windCardinal),
      });

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
          score -= 1;
          deductions.push({
            type: "wind-direction",
            amount: 1,
            reason: "slight deviation",
          });
        } else if (minAngleDiff <= 45) {
          score -= 2;
          deductions.push({
            type: "wind-direction",
            amount: 2,
            reason: "moderate deviation",
          });
        } else if (minAngleDiff <= 90) {
          score -= 3;
          deductions.push({
            type: "wind-direction",
            amount: 3,
            reason: "significant deviation",
          });
        } else {
          score -= 4;
          deductions.push({
            type: "wind-direction",
            amount: 4,
            reason: "extreme deviation",
          });
        }
      }

      // Wind strength scoring
      console.log("Wind strength check:", {
        speed: conditions.windSpeed,
        sheltered: beach.sheltered,
      });

      if (!beach.sheltered) {
        if (conditions.windSpeed > 35) {
          score -= 2;
          deductions.push({
            type: "wind-speed",
            amount: 2,
            reason: "too strong >35kts",
          });
        } else if (conditions.windSpeed > 25) {
          score -= 1.5;
          deductions.push({
            type: "wind-speed",
            amount: 1.5,
            reason: "strong >25kts",
          });
        }
      }

      // Wave size scoring
      console.log("Wave size check:", {
        current: conditions.swellHeight,
        optimal: parsedBeach.swellSize,
      });

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
          score -= 1;
          deductions.push({
            type: "wave-size",
            amount: 1,
            reason: "slight mismatch",
          });
        } else if (heightDiff <= 1) {
          score -= 2;
          deductions.push({
            type: "wave-size",
            amount: 2,
            reason: "moderate mismatch",
          });
        } else {
          score -= 3;
          deductions.push({
            type: "wave-size",
            amount: 3,
            reason: "significant mismatch",
          });
        }
      }

      // Swell direction scoring
      console.log("Swell direction check:", {
        current: conditions.swellDirection,
        optimal: parsedBeach.optimalSwellDirections,
      });

      if (
        !(
          conditions.swellDirection >= parsedBeach.optimalSwellDirections.min &&
          conditions.swellDirection <= parsedBeach.optimalSwellDirections.max
        )
      ) {
        const minDiff = Math.abs(
          conditions.swellDirection - parsedBeach.optimalSwellDirections.min
        );
        const maxDiff = Math.abs(
          conditions.swellDirection - parsedBeach.optimalSwellDirections.max
        );
        const swellDirDiff = Math.min(minDiff, maxDiff);

        if (swellDirDiff <= 10) {
          score -= 1;
          deductions.push({
            type: "swell-direction",
            amount: 1,
            reason: "slight deviation",
          });
        } else if (swellDirDiff <= 20) {
          score -= 2;
          deductions.push({
            type: "swell-direction",
            amount: 2,
            reason: "moderate deviation",
          });
        } else if (swellDirDiff <= 30) {
          score -= 3;
          deductions.push({
            type: "swell-direction",
            amount: 3,
            reason: "significant deviation",
          });
        } else {
          score -= 4;
          deductions.push({
            type: "swell-direction",
            amount: 4,
            reason: "extreme deviation",
          });
        }
      }

      // Swell period scoring
      console.log("Swell period check:", {
        current: conditions.swellPeriod,
        optimal: parsedBeach.idealSwellPeriod,
      });

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
          score -= 1;
          deductions.push({
            type: "swell-period",
            amount: 1,
            reason: "slight mismatch",
          });
        } else {
          score -= 2;
          deductions.push({
            type: "swell-period",
            amount: 2,
            reason: "significant mismatch",
          });
        }
      }

      const finalScore = Math.max(0, Math.round(score));
      console.log("Score calculation complete:", {
        beachId: beach.id,
        beachName: beach.name,
        initialScore: 5,
        deductions,
        rawScore: score,
        finalScore,
      });

      return finalScore;
    } catch (error) {
      console.error("Error calculating beach score:", {
        beachId: beach.id,
        beachName: beach.name,
        error,
        conditions,
        beach: {
          optimalWindDirections: beach.optimalWindDirections,
          optimalSwellDirections: beach.optimalSwellDirections,
          swellSize: beach.swellSize,
          idealSwellPeriod: beach.idealSwellPeriod,
        },
      });
      return 0;
    }
  }

  /**
   * Calculate and store scores for beaches in a region by comparing optimal conditions and today's forecast
   */
  static async calculateAndStoreScores(
    regionId: string,
    forecastData: Pick<
      ForecastA,
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

      scores = beaches.map((beach) => ({
        beachId: beach.id,
        regionId,
        score: this.calculateScore(beach, forecastData),
        date: forecastData.date,
        conditions: {
          windSpeed: forecastData.windSpeed,
          windDirection: forecastData.windDirection,
          swellHeight: forecastData.swellHeight,
          swellDirection: forecastData.swellDirection,
          swellPeriod: forecastData.swellPeriod,
        },
      }));

      console.log(
        `Attempting to upsert ${scores.length} scores for date ${forecastData.date}`
      );

      const upsertOperations = scores.map((score) =>
        prisma.beachDailyScore.upsert({
          where: {
            beachId_date: {
              beachId: score.beachId,
              date: score.date,
            },
          },
          update: {
            score: score.score,
            conditions: score.conditions,
          },
          create: {
            beachId: score.beachId,
            regionId: score.regionId,
            score: score.score,
            date: score.date,
            conditions: score.conditions,
          },
        })
      );

      const results = await prisma.$transaction(upsertOperations);
      console.log(
        `Successfully upserted ${results.length} scores for region ${regionId}`,
        {
          date: forecastData.date,
          firstScore: results[0],
          lastScore: results[results.length - 1],
          scoresUpdated: results.length === scores.length,
        }
      );

      return scores;
    } catch (error) {
      console.error(
        `Failed to calculate/store scores for region ${regionId}:`,
        {
          error,
          date: forecastData.date,
          beachCount: beaches.length,
          scoreCount: scores.length,
        }
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
   * Get region counts for beaches scoring 4 or higher
   */
  static async getRegionCounts(date: Date) {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const regionCounts = await prisma.beachDailyScore.groupBy({
      by: ["regionId"],
      where: {
        date: normalizedDate,
        score: { gte: 4 },
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

  static async getPaginatedScoresWithBeaches({
    regionId,
    date,
    page,
    limit,
    searchQuery,
  }: PaginationParams & { searchQuery?: string }) {
    console.log("Fetching with date:", date);

    const whereClause = {
      regionId,
      ...(searchQuery
        ? {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" as const } },
              {
                region: {
                  name: { contains: searchQuery, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {}),
    };

    // Get all beaches with their scores in a single query
    const beachesWithScores = await prisma.beach.findMany({
      where: whereClause,
      include: {
        beachDailyScores: {
          where: {
            date,
            regionId,
          },
          orderBy: {
            score: "desc",
          },
        },
        region: true,
      },
    });

    console.log(
      "Beaches with scores:",
      beachesWithScores.map((b) => ({
        name: b.name,
        score: b.beachDailyScores[0]?.score,
        date: b.beachDailyScores[0]?.date,
      }))
    );

    // Sort beaches by their score
    const sortedBeaches = beachesWithScores.sort(
      (a, b) =>
        (b.beachDailyScores[0]?.score || 0) -
        (a.beachDailyScores[0]?.score || 0)
    );

    // Apply pagination
    const paginatedBeaches = sortedBeaches.slice(
      (page - 1) * limit,
      page * limit
    );

    // Create scores map
    const scores = Object.fromEntries(
      sortedBeaches.map((beach) => [
        beach.id,
        {
          score: beach.beachDailyScores[0]?.score || 0,
          beach: beach,
        },
      ])
    );

    return {
      scores,
      beaches: paginatedBeaches,
      totalCount: sortedBeaches.length,
      page,
      limit,
    };
  }
}
