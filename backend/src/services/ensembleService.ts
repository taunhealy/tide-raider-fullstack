import { prisma } from "../lib/prisma";
import { ForecastSource, TimeSlot } from "@prisma/client";
import { ScoreService } from "./scoreService";

export class EnsembleService {
  /**
   * Generates a "Tide Raider" ensemble forecast by averaging data from all available sources
   */
  static async updateEnsembleForecast(regionId: string, date: Date, timeSlot: TimeSlot) {
    console.log(`📡 [Ensemble] Generating Tide Raider forecast for ${regionId} on ${date.toISOString().split('T')[0]} (${timeSlot})...`);

    try {
      // 1. Fetch all available forecasts for this slot (excluding TIDE_RAIDER)
      const forecasts = await prisma.forecast.findMany({
        where: {
          regionId,
          date,
          timeSlot,
          source: {
            not: "TIDE_RAIDER"
          }
        }
      });

      if (forecasts.length === 0) {
        console.warn(`⚠️ [Ensemble] No source data found for ${regionId} to generate ensemble.`);
        return null;
      }

      console.log(`📊 [Ensemble] Averaging ${forecasts.length} sources for ${regionId}...`);

      // 2. Calculate Averages
      const averageData = {
        windSpeed: Math.round(forecasts.reduce((sum, f) => sum + f.windSpeed, 0) / forecasts.length),
        windDirection: this.calculateAverageDirection(forecasts.map(f => f.windDirection)),
        swellHeight: Number((forecasts.reduce((sum, f) => sum + f.swellHeight, 0) / forecasts.length).toFixed(2)),
        swellPeriod: Math.round(forecasts.reduce((sum, f) => sum + f.swellPeriod, 0) / forecasts.length),
        swellDirection: this.calculateAverageDirection(forecasts.map(f => f.swellDirection)),
        tide: forecasts.find(f => f.tide)?.tide || null,
        trend: `Ensemble average of ${forecasts.length} sources (${forecasts.map(f => f.source).join(', ')})`
      };

      // 3. Upsert the TIDE_RAIDER forecast
      const ensembleForecast = await prisma.forecast.upsert({
        where: {
          date_regionId_source_timeSlot: {
            date,
            regionId,
            timeSlot,
            source: "TIDE_RAIDER"
          }
        },
        update: averageData,
        create: {
          ...averageData,
          date,
          regionId,
          timeSlot,
          source: "TIDE_RAIDER"
        }
      });

      // 4. Calculate scores for the ensemble
      try {
        await ScoreService.calculateAndStoreScores(regionId, ensembleForecast);
        console.log(`✅ [Ensemble] Tide Raider forecast and scores updated for ${regionId}`);
      } catch (scoreError) {
        console.error(`❌ [Ensemble] Failed to calculate scores for ensemble:`, scoreError);
      }

      return ensembleForecast;
    } catch (error) {
      console.error(`❌ [Ensemble] Error updating ensemble for ${regionId}:`, error);
      throw error;
    }
  }

  /**
   * Helper to calculate average of circular directions (0-360)
   */
  private static calculateAverageDirection(directions: number[]): number {
    if (directions.length === 0) return 0;
    
    // Convert to radians and calculate mean of sin/cos
    let sinSum = 0;
    let cosSum = 0;
    
    directions.forEach(deg => {
      const rad = (deg * Math.PI) / 180;
      sinSum += Math.sin(rad);
      cosSum += Math.cos(rad);
    });
    
    const avgRad = Math.atan2(sinSum / directions.length, cosSum / directions.length);
    let avgDeg = (avgRad * 180) / Math.PI;
    
    // Normalize to 0-360
    if (avgDeg < 0) avgDeg += 360;
    return Math.round(avgDeg);
  }
}
