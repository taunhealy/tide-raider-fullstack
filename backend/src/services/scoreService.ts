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
    beach: any,
    profile: any, // BeachConditionProfile
    conditions: Pick<
      Forecast,
      | "windSpeed"
      | "windDirection"
      | "swellHeight"
      | "swellDirection"
      | "swellPeriod"
    >
  ): { score: number; deductions: string[] } | null {
    try {
      const deductions: string[] = [];
      const parsedProfile = {
        ...profile,
        optimalSwellDirections:
          typeof profile.optimalSwellDirections === "string"
            ? JSON.parse(profile.optimalSwellDirections)
            : profile.optimalSwellDirections,
        swellSize:
          typeof profile.swellSize === "string"
            ? JSON.parse(profile.swellSize)
            : profile.swellSize,
        idealSwellPeriod:
          typeof profile.idealSwellPeriod === "string"
            ? JSON.parse(profile.idealSwellPeriod)
            : profile.idealSwellPeriod,
        optimalWindDirections: 
          Array.isArray(profile.optimalWindDirections) 
            ? profile.optimalWindDirections 
            : typeof profile.optimalWindDirections === "string"
              ? JSON.parse(profile.optimalWindDirections)
              : []
      };

      let score = 5;

      // Wind direction scoring
      const windCardinal = this.degreesToCardinal(conditions.windDirection);

      if (!parsedProfile.optimalWindDirections.includes(windCardinal)) {
        const minAngleDiff = parsedProfile.optimalWindDirections.reduce(
          (minDiff: number, optimalDir: string) => {
            const optimalDegrees = this.cardinalToDegreesMap[optimalDir];
            const diff = Math.abs(conditions.windDirection - optimalDegrees);
            const angleDiff = Math.min(diff, 360 - diff);
            return Math.min(minDiff, angleDiff);
          },
          180
        );

        let penalty = 0;
        if (minAngleDiff <= 22.5) {
          penalty = 0.5;
        } else if (minAngleDiff <= 45) {
          penalty = 1;
        } else if (minAngleDiff <= 90) {
          penalty = 2;
        } else {
          penalty = 3;
        }
        score -= penalty;
        deductions.push(`Wind direction ${windCardinal} is suboptimal (Off by ${Math.round(minAngleDiff)}°)`);
      }

      // Wind strength scoring - Only penalize if NOT optimal wind (onshore/cross)
      const isOptimalWind = profile.optimalWindDirections.includes(windCardinal);
      
      if (!isOptimalWind && !beach.sheltered) {
        if (conditions.windSpeed > 25) {
          score -= 2.5; 
        } else if (conditions.windSpeed > 15) {
          score -= 1.5;
        } else if (conditions.windSpeed > 10) {
          score -= 0.5;
        }
      } else if (conditions.windSpeed > 35) {
        // Even if offshore, 35kts+ is too much
        score -= 2;
      }

      // Wave size scoring
      if (
        !(
          conditions.swellHeight >= parsedProfile.swellSize.min &&
          conditions.swellHeight <= parsedProfile.swellSize.max
        )
      ) {
        const heightDiff = Math.min(
          Math.abs(conditions.swellHeight - parsedProfile.swellSize.min),
          Math.abs(conditions.swellHeight - parsedProfile.swellSize.max)
        );
        let sizePenalty = 0;
        if (heightDiff <= 0.5) {
          sizePenalty = 0.5;
        } else if (heightDiff <= 1) {
          sizePenalty = 1;
        } else {
          sizePenalty = 3;
        }
        score -= sizePenalty;
        deductions.push(`Swell height ${conditions.swellHeight}m is ${conditions.swellHeight < parsedProfile.swellSize.min ? "too small" : "too large"} for this spot (Optimal: ${parsedProfile.swellSize.min}-${parsedProfile.swellSize.max}m).`);
      }

      // Swell direction scoring
      if (
        !(
          conditions.swellDirection >= parsedProfile.optimalSwellDirections.min &&
          conditions.swellDirection <= parsedProfile.optimalSwellDirections.max
        )
      ) {
        // Calculate minimum angle difference considering wrap-around (0° = 360°)
        const minDiff = Math.abs(
          conditions.swellDirection - parsedProfile.optimalSwellDirections.min
        );
        const maxDiff = Math.abs(
          conditions.swellDirection - parsedProfile.optimalSwellDirections.max
        );
        // Consider wrap-around for both differences
        const minDiffWrapped = Math.min(minDiff, 360 - minDiff);
        const maxDiffWrapped = Math.min(maxDiff, 360 - maxDiff);
        const swellDirDiff = Math.min(minDiffWrapped, maxDiffWrapped);

        let dirPenalty = 0;
        if (swellDirDiff <= 20) {
          dirPenalty = 1;
        } else if (swellDirDiff <= 45) {
          dirPenalty = 2;
        } else {
          dirPenalty = 3;
        }
        score -= dirPenalty;
        deductions.push(`Swell direction ${conditions.swellDirection}° is out of alignment (Off by ${Math.round(swellDirDiff)}°).`);
      }

      // Swell period scoring - Wave type aware
      const isBeachBreak = beach.waveType === "BEACH_BREAK";
      const periodThreshold = isBeachBreak ? 9 : 12;

      if (conditions.swellPeriod < (periodThreshold - 3)) {
        // Severe penalty for very short swell period
        score -= 2;
        deductions.push(`Very short swell period: ${conditions.swellPeriod}s`);
      } else if (conditions.swellPeriod < periodThreshold) {
        // Slight penalty for moderate period
        score -= 0.5;
      } else if (
        !(
          conditions.swellPeriod >= parsedProfile.idealSwellPeriod.min &&
          conditions.swellPeriod <= parsedProfile.idealSwellPeriod.max
        )
      ) {
        const periodDiff = Math.min(
          Math.abs(conditions.swellPeriod - parsedProfile.idealSwellPeriod.min),
          Math.abs(conditions.swellPeriod - parsedProfile.idealSwellPeriod.max)
        );
        if (periodDiff <= 2) {
          score -= 0.5;
        } else {
          score -= 1;
        }
      }

      const finalScore = Math.min(5, Math.max(0, score));
      return { 
        score: Number(finalScore.toFixed(1)), 
        deductions 
      };
    } catch (error) {
      return { score: 0, deductions: ["Internal calculation error"] };
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
      | "source"
    > & { timeSlot: string }
  ) {
    let beaches: Beach[] = [];
    let scores: any[] = [];

    try {
      beaches = await prisma.beach.findMany({
        where: { regionId },
        include: { conditionProfiles: true }
      });

      console.log(`Found ${beaches.length} beaches for region ${regionId}`);

      beaches.forEach((beach: any) => {
        const profiles = beach.conditionProfiles || [];
        
        // If a beach has no profiles, we skip it or could fallback to a dummy GENERAL profile
        profiles.forEach((profile: any) => {
          const result = this.calculateScore(beach, profile, forecastData);
          const calculatedScore = result?.score ?? 0;
          const deductions = result?.deductions ?? [];

          const integerScore = Math.round(calculatedScore * 2);

          const scoreOutOfFive = Math.floor(integerScore / 2);
          const starRating = Math.max(1, Math.min(5, scoreOutOfFive));

          scores.push({
            beachId: beach.id,
            regionId,
            category: profile.category,
            source: forecastData.source,
            timeSlot: (forecastData as any).timeSlot || "MORNING",
            score: integerScore,
            starRating: starRating,
            date: forecastData.date,
            conditions: {
              windSpeed: forecastData.windSpeed,
              windDirection: forecastData.windDirection,
              swellHeight: forecastData.swellHeight,
              swellDirection: forecastData.swellDirection,
              swellPeriod: forecastData.swellPeriod,
              tide: (forecastData as any).tide || "",
              deductions: deductions,
            },
          });
        });
      });

      console.log(
        `Attempting to upsert ${scores.length} scores for date ${forecastData.date} (${forecastData.timeSlot})`
      );

      // Delete existing scores for this region, date, source AND timeSlot
      const deleteResult = await prisma.beachDailyScore.deleteMany({
        where: {
          regionId,
          date: forecastData.date,
          source: forecastData.source,
          timeSlot: (forecastData as any).timeSlot || "MORNING",
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
   * Get stored scores for a specific date, region, source and timeSlot
   */
  static async getScores(regionId: string, date: Date, source?: string, timeSlot?: string) {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    return prisma.beachDailyScore.findMany({
      where: {
        regionId,
        date: normalizedDate,
        ...(source ? { source } : {}),
        ...(timeSlot ? { timeSlot: timeSlot as any } : {}),
      },
      include: {
        beach: true,
      },
    });
  }

  /**
   * Get region counts for beaches scoring 4 or higher (score >= 8)
   */
  static async getRegionCounts(date: Date, timeSlot?: string) {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const whereClause: any = {
      date: normalizedDate,
      score: { gte: 8 },
    };

    if (timeSlot) {
      whereClause.timeSlot = timeSlot as any;
    }

    const regionCounts = await prisma.beachDailyScore.groupBy({
      by: ["regionId"],
      where: whereClause,
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
      source?: string;
      timeSlot?: string;
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
          if (value !== undefined) {
            if (key === "timeSlot" || key === "source") return acc; // Handled separately
            if (key === "isHiddenGem") {
              if (value === true) {
                (acc as any).isHiddenGem = true;
              } else {
                (acc as any).AND = [
                  {
                    OR: [{ isHiddenGem: false }, { isHiddenGem: null }],
                  },
                ];
              }
            } else if (Array.isArray(value)) {
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
            } else if (typeof value === "boolean" && key !== "isHiddenGem") {
              (acc as any)[key] = value;
            }
          }
          return acc;
        },
        {} as Prisma.BeachWhereInput
      ),
    };

    // Determine the exact timeSlot to query
    let queryTimeSlot: any = filters.timeSlot || "MORNING";
    let queryCategory: any = (filters as any).category || "GENERAL";

    // Get ALL beaches with their scores in a single query
    const beachesWithScores = await prisma.beach.findMany({
      where: whereClause,
      include: {
        beachDailyScores: {
          where: {
            date: normalizedDate,
            regionId,
            timeSlot: queryTimeSlot,
            category: queryCategory,
            ...(filters.source ? { source: filters.source } : {}),
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
