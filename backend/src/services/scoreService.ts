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
  ): { score: number; deductions: string[]; checklist: any } | null {
    try {
      const deductions: string[] = [];
      
      // Extract and normalize conditions with defaults
      const windSpeed = conditions.windSpeed ?? 0;
      const windDirection = conditions.windDirection ?? 0;
      const swellHeight = conditions.swellHeight ?? 0;
      const swellDirection = conditions.swellDirection ?? 0;
      const swellPeriod = conditions.swellPeriod ?? 10;

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
      const windCardinal = this.degreesToCardinal(windDirection);
      const isOptimalWind = parsedProfile.optimalWindDirections.includes(windCardinal);
      let minAngleDiff = 0;

      if (!isOptimalWind) {
        minAngleDiff = parsedProfile.optimalWindDirections.reduce(
          (minDiff: number, optimalDir: string) => {
            const optimalDegrees = this.cardinalToDegreesMap[optimalDir];
            const diff = Math.abs(windDirection - optimalDegrees);
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
        if (windSpeed <= 8) {
          // Onshore wind ruins beach breaks even at low speeds
          // If it's direct onshore (> 90), we don't scale it down as much
          const onshoreThreshold = 90;
          const isOnshore = minAngleDiff > onshoreThreshold;
          
          if (isOnshore) {
            windFactor = isReefOrPoint ? 0.4 : 0.75; // More punishing for onshore even if light
          } else {
            windFactor = isReefOrPoint ? 0.2 : 0.5; // Very light offshore is negligible penalty
          }
        } else if (windSpeed <= 12) {
          windFactor = isReefOrPoint ? 0.6 : 0.85;
        }
        
        const finalPenalty = penalty * windFactor;
        score -= finalPenalty;
        
        if (finalPenalty > 0) {
          const reductionMsg = windFactor < 1.0 ? `, penalty reduced due to ${windSpeed}kt wind` : "";
          deductions.push(`Wind direction ${windCardinal} is suboptimal (Off by ${Math.round(minAngleDiff)}°${reductionMsg})`);
        }
      }

      // 2. Wind strength scoring
      if (!isOptimalWind && !beach.sheltered) {
        if (windSpeed > 25) score -= 2.5; 
        else if (windSpeed > 15) score -= 1.5;
        else if (windSpeed > 10) score -= 0.5;
      } else if (windSpeed > 35) {
        score -= 2.0; // Even offshore, 35kts+ is too much
      }

      // 3. Swell Alignment & Size Analysis
      const optSwell = parsedProfile.optimalSwellDirections;
      
      const minSwellDiff = Math.abs(swellDirection - optSwell.min);
      const maxSwellDiff = Math.abs(swellDirection - optSwell.max);
      const swellDirDiff = Math.min(Math.min(minSwellDiff, 360 - minSwellDiff), Math.min(maxSwellDiff, 360 - maxSwellDiff));

      let isOptimalSwellDir = false;
      if (optSwell.min <= optSwell.max) {
        isOptimalSwellDir = swellDirection >= optSwell.min && swellDirection <= optSwell.max;
      } else {
        // Wrap around case (e.g. 350 to 20)
        isOptimalSwellDir = swellDirection >= optSwell.min || swellDirection <= optSwell.max;
      }

      // Wave Science: Period-Dependent Refraction (Wrap)
      // Long period swells (12s+) "feel" the bottom deeper and turn much better than short period swells.
      const periodWrapFactor = Math.max(0.7, Math.min(1.3, swellPeriod / 12));
      
      // Dynamic swell min/max: Handle 'Refraction' (Raw vs Refracted energy)
      // Refracted swells (e.g. SW at Muizenberg) lose size as they wrap, so they need more size at the buoy 
      // but can handle much larger buoy heights before becoming hectic.
      // Direct swells (e.g. S or E at Muizenberg) hit with raw power, so they work when small 
      // but become chaotic/hectic very quickly.
      let effectiveMinHeight = parsedProfile.swellSize.min;
      let effectiveMaxHeight = parsedProfile.swellSize.max;
      let isHectic = false;

      if (parsedProfile.swellSize.exposureDirection !== undefined) {
        // Calculate 'Refraction Quality' (0 = direct/raw, 1 = fully refracted/groomed)
        // We assume 90-120 degrees of wrap is optimal for grooming.
        const exposureDiff = Math.abs(swellDirection - parsedProfile.swellSize.exposureDirection);
        const normalizedExposureDiff = Math.min(exposureDiff, 360 - exposureDiff);
        
        // Refraction Factor: 0 at exposureDirection, 1 at 45+ degrees away
        const refractionFactor = Math.min(1, normalizedExposureDiff / 45) * (periodWrapFactor >= 1 ? 1 : 0.7);
        
        // If it's a refracted swell (refractionFactor > 0.3):
        // - It needs more size to reach the beach (increase min)
        // - It can handle much more size (increase max)
        if (refractionFactor > 0.3) {
          let sizeLossFactor = 1 + (refractionFactor * 0.4); 
          
          // EXTREME WRAP: For swells hitting from "behind the corner" (> 65 degrees from exposure)
          // The loss of energy is much more severe. This handles spots like Muizenberg during West swells.
          if (normalizedExposureDiff > 65) {
            // Rapidly increase the buoy size requirement as the angle increases
            const extremeWrapSeverity = Math.pow((normalizedExposureDiff - 65) / 20, 2);
            sizeLossFactor += extremeWrapSeverity * 2.5; 
          }
          
          effectiveMinHeight *= sizeLossFactor;
          
          // Max height increases significantly for refracted swells
          const capacityBonus = (parsedProfile.swellSize.max - (parsedProfile.swellSize.exposureLimit || parsedProfile.swellSize.max)) * refractionFactor;
          
          // For extreme wrap, even a very large buoy swell (6m+) might be manageable at the beach
          const capacityMultiplier = normalizedExposureDiff > 65 ? (sizeLossFactor * 0.8) : 1;
          effectiveMaxHeight = ((parsedProfile.swellSize.exposureLimit || parsedProfile.swellSize.max) + capacityBonus) * capacityMultiplier;
        } else {
          // It's a direct swell:
          // - It works at smaller sizes (keep or slightly lower min)
          // - It becomes hectic early (use exposureLimit as max)
          effectiveMaxHeight = parsedProfile.swellSize.exposureLimit || effectiveMaxHeight;
          if (swellHeight > effectiveMaxHeight) {
            isHectic = true;
          }
        }
        
        // Bonus for long period (they are cleaner/more organized even when big)
        const periodBonus = Math.max(0, (swellPeriod - 12) * 0.1); 
        effectiveMaxHeight += periodBonus;
      } else {
        // Fallback for spots without exposure metadata
        if (isOptimalSwellDir) {
          const refractionBonus = 0.15 + (Math.max(0, periodWrapFactor - 1) * 0.5);
          effectiveMinHeight *= (1 - Math.min(0.3, refractionBonus)); 
        } else {
          const baseAlignmentPenalty = (swellDirDiff / 15) * 0.25;
          const periodPenaltyScale = 1 / periodWrapFactor; 
          effectiveMinHeight += Math.min(1.2, baseAlignmentPenalty * periodPenaltyScale);
        }
      }


      const isTooSmall = swellHeight < effectiveMinHeight;
      const isTooLarge = swellHeight > effectiveMaxHeight;

      if (isTooSmall || isTooLarge) {
        const heightDiff = isTooSmall 
          ? effectiveMinHeight - swellHeight
          : swellHeight - effectiveMaxHeight;

        let sizePenalty = 0;
        if (isTooSmall) {
          const smallFactor = isReefOrPoint ? 2.5 : 1.5; 
          if (heightDiff <= 0.3) sizePenalty = 0.5 * smallFactor;
          else if (heightDiff <= 0.8) sizePenalty = 1.5 * smallFactor;
          else sizePenalty = 3.5 * smallFactor;
        } else {
          if (heightDiff <= 0.5) sizePenalty = 0.8;
          else if (heightDiff <= 1.5) sizePenalty = 2.0;
          else sizePenalty = 3.5;

          if (isHectic) sizePenalty += 1.0; 
        }

        score -= sizePenalty;
        
        const wrapType = (parsedProfile.swellSize.exposureDirection !== undefined)
          ? (Math.abs(swellDirection - parsedProfile.swellSize.exposureDirection) > 45 ? 'refracted' : 'direct')
          : 'standard';
          
        const sizeMsg = isTooSmall 
          ? `${swellHeight}m is too small (Min: ${effectiveMinHeight.toFixed(1)}m for ${wrapType} swell)`
          : `${swellHeight}m is too large/chaotic (Max: ${effectiveMaxHeight.toFixed(1)}m for ${wrapType} swell)`;
          
        deductions.push(`Swell height ${sizeMsg}.`);
      }

      // 4. Swell direction scoring (Reuse calculated diff)
      if (!isOptimalSwellDir) {
        let dirPenalty = 0;
        if (swellDirDiff <= 20) dirPenalty = 0.8;
        else if (swellDirDiff <= 45) dirPenalty = 1.5;
        else dirPenalty = 2.5;

        score -= dirPenalty;
        deductions.push(`Swell direction ${swellDirection}° is out of alignment (Off by ${Math.round(swellDirDiff)}°).`);
      }

      // 5. Swell period scoring
      const idealMinPeriod = parsedProfile.idealSwellPeriod.min || 12;
      
      if (swellPeriod < 8) {
        score -= 3.0;
        deductions.push(`Critical: Very short period (${swellPeriod}s) - high probability of "wind slop"`);
      } else if (swellPeriod < Math.min(10, idealMinPeriod)) {
        score -= 1.8;
        deductions.push(`Significant: Short period (${swellPeriod}s) - suboptimal quality`);
      } else if (swellPeriod < idealMinPeriod) {
        // If the spot's ideal min is lower (e.g. 10s for Muizenberg), don't penalize as hard for 10-12s
        const periodPenalty = idealMinPeriod <= 10 ? 0.3 : 0.8;
        score -= periodPenalty;
        deductions.push(`Suboptimal: Moderate period (${swellPeriod}s) - ${idealMinPeriod}s+ is optimal`);
      } else if (
        !(
          swellPeriod >= parsedProfile.idealSwellPeriod.min &&
          swellPeriod <= parsedProfile.idealSwellPeriod.max
        )
      ) {
        const periodDiff = Math.min(
          Math.abs(swellPeriod - parsedProfile.idealSwellPeriod.min),
          Math.abs(swellPeriod - parsedProfile.idealSwellPeriod.max)
        );
        // Penalize deviations from the spot-specific ideal range
        score -= periodDiff <= 2 ? 0.4 : 1.0;
        deductions.push(`Period ${swellPeriod}s is outside spot-specific ideal range (${parsedProfile.idealSwellPeriod.min}-${parsedProfile.idealSwellPeriod.max}s)`);
      }

      let finalScore = Math.min(5, Math.max(0, score));
      if (isNaN(finalScore)) {
        console.warn(`[ScoreService] ⚠️ Calculated score for beach ${beach.id} is NaN. Defaulting to 0.`);
        finalScore = 0;
      }

      return { 
        score: Number(finalScore.toFixed(1)), 
        deductions,
        checklist: {
          windDirection: isOptimalWind || (minAngleDiff <= 22.5),
          windSpeed: windSpeed <= 25 || beach.sheltered,
          swellDirection: isOptimalSwellDir || swellDirDiff <= 5,
          swellHeight: !isTooSmall && !isTooLarge,
          swellPeriod: Math.round(swellPeriod) >= parsedProfile.idealSwellPeriod.min && Math.round(swellPeriod) <= parsedProfile.idealSwellPeriod.max
        }
      };
    } catch (error) {
      return { score: 0, deductions: ["Internal calculation error"], checklist: null };
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
          const checklist = result?.checklist ?? null;

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
            source: forecastData.source as any,
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
              checklist: checklist,
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
          source: forecastData.source as any,
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
        ...(source ? { source: source as any } : {}),
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
            ...(filters.source ? { source: filters.source as any } : {}),
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
