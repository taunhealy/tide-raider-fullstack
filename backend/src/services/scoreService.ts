import { prisma } from "../lib/prisma";
import type { Beach, ForecastA } from "@prisma/client";

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
          score += 0.5;
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
          score -= 2;
        }
      }

      // Swell direction scoring
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
}
