import type { Beach } from "@/app/types/beaches";
import type { CoreForecastData } from "@/app/types/forecast";
import type { BeachScoreMap } from "@/app/types/scores";

/**
 * Calculate scores for all beaches based on forecast conditions
 */
export function calculateAllBeachScores(
  beaches: Beach[],
  forecastData: CoreForecastData | null
): BeachScoreMap {
  if (!forecastData) {
    return {};
  }

  const scores: BeachScoreMap = {};

  for (const beach of beaches) {
    scores[beach.id] = {
      score: 0, // Default score, should be calculated based on conditions
      beach: {
        beachDailyScores: [
          {
            date: new Date().toISOString(),
            conditions: {
              windSpeed: forecastData.windSpeed || 0,
              windDirection: forecastData.windDirection || 0,
              swellHeight: forecastData.swellHeight || 0,
              swellDirection: forecastData.swellDirection || 0,
              swellPeriod: forecastData.swellPeriod || 0,
            },
          },
        ],
      },
    };
  }

  return scores;
}

/**
 * Calculate beach counts by region from beach scores
 */
export function calculateRegionCounts(
  beachScores: BeachScoreMap
): Record<string, number> {
  const regionCounts: Record<string, number> = {};

  // Since BeachScoreMap doesn't contain region info directly,
  // we'll return an empty object for now
  // This should be enhanced based on actual requirements
  return regionCounts;
}

