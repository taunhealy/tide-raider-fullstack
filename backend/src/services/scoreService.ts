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

      let score = 5.0;
      const isReefOrPoint = beach.waveType === "REEF_BREAK" || beach.waveType === "POINT_BREAK";

      // 1. Wind direction scoring
      const windCardinal = this.degreesToCardinal(conditions.windDirection);
      const isOptimalWind = parsedProfile.optimalWindDirections.includes(windCardinal);

      if (!isOptimalWind) {
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
          penalty = 1.2;
        } else if (minAngleDiff <= 90) {
          penalty = 2.5;
        } else if (minAngleDiff <= 135) {
          penalty = 3.5;
        } else {
          // Direct onshore
          penalty = 4.5; 
        }

        // Scale penalty based on wind strength
        let windFactor = 1.0;
        if (conditions.windSpeed <= 8) {
          // Onshore wind ruins beach breaks even at low speeds
          // If it's direct onshore (> 90), we don't scale it down as much
          const onshoreThreshold = 90;
          const isOnshore = minAngleDiff > onshoreThreshold;
          
          if (isOnshore) {
            windFactor = isReefOrPoint ? 0.4 : 0.75; // More punishing for onshore even if light
          } else {
            windFactor = isReefOrPoint ? 0.2 : 0.5; // Very light offshore is negligible penalty
          }
        } else if (conditions.windSpeed <= 12) {
          windFactor = isReefOrPoint ? 0.6 : 0.85;
        }
        
        const finalPenalty = penalty * windFactor;
        score -= finalPenalty;
        
        if (finalPenalty > 0) {
          deductions.push(`Wind direction ${windCardinal} is suboptimal (Off by ${Math.round(minAngleDiff)}°, penalty scaled by ${windFactor.toFixed(1)}x due to ${conditions.windSpeed}kt wind)`);
        }
      }

      // 2. Wind strength scoring
      if (!isOptimalWind && !beach.sheltered) {
        if (conditions.windSpeed > 25) score -= 2.5; 
        else if (conditions.windSpeed > 15) score -= 1.5;
        else if (conditions.windSpeed > 10) score -= 0.5;
      } else if (conditions.windSpeed > 35) {
        score -= 2.0; // Even offshore, 35kts+ is too much
      }

      // 3. Wave size scoring - Aggressive penalty for under-sized swell
      const isTooSmall = conditions.swellHeight < parsedProfile.swellSize.min;
      const isTooLarge = conditions.swellHeight > parsedProfile.swellSize.max;

      if (isTooSmall || isTooLarge) {
        const heightDiff = isTooSmall 
          ? parsedProfile.swellSize.min - conditions.swellHeight
          : conditions.swellHeight - parsedProfile.swellSize.max;

        let sizePenalty = 0;
        if (isTooSmall) {
          // Being under-sized is a deal-breaker for certain spots
          const smallFactor = isReefOrPoint ? 2.5 : 1.5; 
          if (heightDiff <= 0.3) sizePenalty = 0.5 * smallFactor;
          else if (heightDiff <= 0.8) sizePenalty = 1.5 * smallFactor;
          else sizePenalty = 3.5 * smallFactor;
        } else {
          // Too big is messy but sometimes surfable
          if (heightDiff <= 0.5) sizePenalty = 0.5;
          else if (heightDiff <= 1.5) sizePenalty = 1.5;
          else sizePenalty = 3.0;
        }

        score -= sizePenalty;
        deductions.push(`Swell height ${conditions.swellHeight}m is ${isTooSmall ? "too small" : "too large"} (Optimal: ${parsedProfile.swellSize.min}-${parsedProfile.swellSize.max}m).`);
      }

      // 4. Swell direction scoring
      if (
        !(
          conditions.swellDirection >= parsedProfile.optimalSwellDirections.min &&
          conditions.swellDirection <= parsedProfile.optimalSwellDirections.max
        )
      ) {
        const minDiff = Math.abs(conditions.swellDirection - parsedProfile.optimalSwellDirections.min);
        const maxDiff = Math.abs(conditions.swellDirection - parsedProfile.optimalSwellDirections.max);
        const swellDirDiff = Math.min(Math.min(minDiff, 360 - minDiff), Math.min(maxDiff, 360 - maxDiff));

        let dirPenalty = 0;
        if (swellDirDiff <= 20) dirPenalty = 0.8;
        else if (swellDirDiff <= 45) dirPenalty = 1.5;
        else dirPenalty = 2.5;

        score -= dirPenalty;
        deductions.push(`Swell direction ${conditions.swellDirection}° is out of alignment (Off by ${Math.round(swellDirDiff)}°).`);
      }

      // 5. Swell period scoring
      if (conditions.swellPeriod < 8) {
        score -= 3.0;
        deductions.push(`Critical: Very short period (${conditions.swellPeriod}s) - high probability of "wind slop"`);
      } else if (conditions.swellPeriod < 10) {
        score -= 1.8;
        deductions.push(`Significant: Short period (${conditions.swellPeriod}s) - suboptimal quality`);
      } else if (conditions.swellPeriod < 12) {
        score -= 0.8;
        deductions.push(`Suboptimal: Moderate period (${conditions.swellPeriod}s) - 12s+ is optimal`);
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
        // Penalize deviations from the spot-specific ideal range
        score -= periodDiff <= 2 ? 0.4 : 1.0;
        deductions.push(`Period ${conditions.swellPeriod}s is outside spot-specific ideal range (${parsedProfile.idealSwellPeriod.min}-${parsedProfile.idealSwellPeriod.max}s)`);
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
        
        profiles.forEach((profile: any) => {
          const result = this.calculateScore(beach, profile, forecastData);
          const calculatedScore = result?.score ?? 0;
          const deductions = result?.deductions ?? [];

          // Star Rating Logic: More intuitive rounding
          // 4.5 - 5.0 -> 5 stars
          // 3.5 - 4.4 -> 4 stars
          // etc.
          const starRating = Math.max(1, Math.min(5, Math.round(calculatedScore)));
          
          // Legacy score out of 10 for backward compatibility
          const integerScore = Math.round(calculatedScore * 2);

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
   * Get region counts for unique beaches scoring 4 or higher (score >= 8)
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

    // Get all scores matching the criteria
    const scores = await prisma.beachDailyScore.findMany({
      where: whereClause,
      select: {
        regionId: true,
        beachId: true,
      },
    });

    // Count unique beaches per region
    const counts: Record<string, Set<string>> = {};
    
    scores.forEach(score => {
      if (!counts[score.regionId]) {
        counts[score.regionId] = new Set();
      }
      counts[score.regionId].add(score.beachId);
    });

    // Convert Sets to counts
    return Object.entries(counts).reduce(
      (acc, [regionId, beachSet]) => ({
        ...acc,
        [regionId]: beachSet.size,
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
        intelligenceReports: {
          where: {
            date: normalizedDate,
            duration: 1
          },
          select: { id: true },
          take: 1
        }
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
          hasAIReport: (beach as any).intelligenceReports?.length > 0,
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
