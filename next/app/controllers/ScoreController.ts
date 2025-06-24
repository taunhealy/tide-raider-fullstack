import { prisma } from "@/app/lib/prisma";
import { ScoreService } from "@/app/services/scores/ScoreService";

import type { CoreForecastData } from "@/app/types/forecast";

export class ScoreController {
  static async processRegionWithRetry(regionId: string) {
    try {
      // Get today's forecast
      const forecast = await prisma.forecastA.findFirst({
        where: {
          regionId,
          date: {
            equals: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        select: {
          windSpeed: true,
          windDirection: true,
          swellHeight: true,
          swellDirection: true,
          swellPeriod: true,
          date: true,
        },
      });

      if (!forecast) {
        console.error(
          `⚠️ Cannot calculate scores: No forecast data found in ForecastA for region ${regionId}`
        );
        return null;
      }

      return await ScoreService.calculateAndStoreScores(regionId, forecast);
    } catch (error) {
      console.error(`❌ Failed to process region ${regionId}:`, error);
      return null;
    }
  }

  private static async logFailure(regionId: string, error: any) {
    console.error(`Failed to calculate scores for region ${regionId}:`, error);
  }

  /**
   * Get scores for a specific region and date
   */
  async getRegionScores(regionId: string, date: Date) {
    return ScoreService.getScores(regionId, date);
  }

  /**
   * Get count of good beaches (score >= 4) by region
   */
  async getRegionCounts(date: Date) {
    return ScoreService.getRegionCounts(date);
  }

  /**
   * Get forecast data for a region
   */
  private async getForecastData(
    regionId: string,
    date: Date
  ): Promise<CoreForecastData | null> {
    const forecast = await prisma.forecastA.findFirst({
      where: {
        regionId,
        date,
      },
    });

    if (!forecast) return null;

    return {
      windSpeed: forecast.windSpeed,
      windDirection: forecast.windDirection,
      swellHeight: forecast.swellHeight,
      swellDirection: forecast.swellDirection,
      swellPeriod: forecast.swellPeriod,
      date: forecast.date,
      regionId: forecast.regionId,
    };
  }
}
