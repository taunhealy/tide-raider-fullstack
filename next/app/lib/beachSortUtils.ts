// next/app/lib/beachSortUtils.ts
import type { Beach } from "@/app/types/beaches";
import type { ForecastData } from "@/app/types/forecast";
import { calculateBeachScore } from "@/app/lib/surfUtils";

interface ScoredBeach {
  beach: Beach;
  score: number;
}

export function sortBeachesByScore(
  beaches: Beach[],
  forecastData: ForecastData | null,
  minPoints: number = 0
): Beach[] {
  const scoredBeaches: ScoredBeach[] = beaches.map((beach) => ({
    beach,
    score: forecastData ? calculateBeachScore(beach, forecastData).score : 0,
  }));

  // Filter by minimum points if specified
  const filteredBeaches = scoredBeaches.filter(
    ({ score }) => minPoints === 0 || score >= minPoints
  );

  // Sort by score in descending order (highest first)
  return filteredBeaches
    .sort((a, b) => b.score - a.score)
    .map(({ beach }) => beach);
}
