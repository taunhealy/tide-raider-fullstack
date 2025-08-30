import { prisma } from "@/app/lib/prisma";
import { CoreForecastData } from "@/app/types/forecast";
import type {
  Beach,
  ForecastA,
  Difficulty,
  WaveType,
  CrimeLevel,
  Season,
  Month,
  Hazard,
  SharkRisk,
} from "@prisma/client";
import { Prisma } from "@prisma/client";

interface PaginationParams {
  regionId: string;
  date: Date;
  page: number;
  limit: number;
}

// Database-specific filter interface
interface BeachFiltersDB {
  difficulty?: Difficulty[]; // Prisma enum
  waveType?: WaveType[]; // Prisma enum
  crimeLevel?: string[];
  isHiddenGem?: boolean;
}

interface GetBeachesParams {
  regionId: string;
  date: Date;
  searchQuery?: string;
  filters?: Partial<BeachFiltersDB>; // Use DB-specific interface
}

// Update FilterKeys to include all possible filter keys
type FilterKeys = keyof typeof FILTER_MAPPINGS;

const FILTER_MAPPINGS = {
  difficulty: (values: string[]) => ({
    in: values.map((v) => v.toUpperCase() as Difficulty),
  }),
  waveType: (values: string[]) => ({
    in: values.map((v) => v.toUpperCase() as WaveType),
  }),
  crimeLevel: (values: string[]) => ({
    in: values.map((v) => v.toUpperCase() as CrimeLevel),
  }),
  bestSeasons: (values: string[]) => ({
    hasSome: values.map((v) => v.toUpperCase() as Season),
  }),
  hazards: (values: string[]) => ({
    hasSome: values.map((v) => v.toUpperCase() as Hazard),
  }),
  bestMonthOfYear: (values: string[]) => ({
    equals: values[0].toUpperCase() as Month,
  }),
  sharkAttack: (values: string[]) => ({
    equals: values[0].toUpperCase() as SharkRisk,
  }),
} as const;

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
  ): number | null {
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

      // Wind direction scoring - More lenient and rewards near-optimal conditions
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
          // Reward near-optimal conditions
          score += 0.5;
          deductions.push({
            type: "wind-direction",
            amount: -0.5, // Negative means bonus
            reason: "near optimal conditions",
          });
        } else if (minAngleDiff <= 45) {
          score -= 1; // Reduced penalty
          deductions.push({
            type: "wind-direction",
            amount: 1,
            reason: "moderate deviation",
          });
        } else if (minAngleDiff <= 90) {
          score -= 2; // Reduced from -3
          deductions.push({
            type: "wind-direction",
            amount: 2,
            reason: "significant deviation",
          });
        } else {
          score -= 3; // Reduced from -4
          deductions.push({
            type: "wind-direction",
            amount: 3,
            reason: "extreme deviation",
          });
        }
      }

      // Wind strength scoring - Kept as is since it's already reasonable
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

      // Check if other conditions are favorable for more lenient scoring
      const goodConditions =
        conditions.swellHeight >= parsedBeach.swellSize.min &&
        conditions.swellHeight <= parsedBeach.swellSize.max &&
        conditions.swellPeriod >= parsedBeach.idealSwellPeriod.min &&
        conditions.swellPeriod <= parsedBeach.idealSwellPeriod.max &&
        conditions.windSpeed <= 25;

      // Wave size scoring - More lenient when close to range
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
          score -= 0.5; // Reduced from -1
          deductions.push({
            type: "wave-size",
            amount: 0.5,
            reason: "slightly outside optimal range",
          });
        } else if (heightDiff <= 1) {
          score -= 1; // Reduced from -2
          deductions.push({
            type: "wave-size",
            amount: 1,
            reason: "moderate mismatch",
          });
        } else {
          score -= 2; // Reduced from -3
          deductions.push({
            type: "wave-size",
            amount: 2,
            reason: "significant mismatch",
          });
        }
      }

      // Swell direction scoring - More strict penalties
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

        // Remove the penalty multiplier and increase base penalties
        if (swellDirDiff <= 20) {
          score -= 1; // Was 1
          deductions.push({
            type: "swell-direction",
            amount: 1,
            reason: "slight deviation from optimal swell direction",
          });
        } else if (swellDirDiff <= 45) {
          score -= 2;
          deductions.push({
            type: "swell-direction",
            amount: 2,
            reason: "moderate deviation from optimal swell direction",
          });
        } else {
          score -= 3;
          deductions.push({
            type: "swell-direction",
            amount: 3,
            reason: "significant deviation from optimal swell direction",
          });
        }
      }

      // Swell period scoring - More lenient
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
          score -= 0.5; //
          deductions.push({
            type: "swell-period",
            amount: 0.5,
            reason: "slight mismatch",
          });
        } else {
          score -= 1; // Reduced from -2
          deductions.push({
            type: "swell-period",
            amount: 1,
            reason: "significant mismatch",
          });
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

      scores = beaches.map((beach) => {
        const calculatedScore = this.calculateScore(beach, forecastData);

        // Convert score to integer 0-10 by multiplying by 2 and rounding
        const integerScore =
          calculatedScore === null ? 0 : Math.round(calculatedScore * 2);

        return {
          beachId: beach.id,
          regionId,
          // Store as regular integer
          score: integerScore,
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

  static async getBeachesWithScores({
    regionId,
    date,
    searchQuery,
    filters = {},
  }: GetBeachesParams) {
    console.log("Fetching beaches with scores and filters:", { filters });

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
            date,
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
          score: beach.beachDailyScores[0]?.score ?? 0, // Changed null to 0
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
