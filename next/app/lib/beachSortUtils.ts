// next/app/lib/beachSortUtils.ts
import type { Beach } from "@/app/types/beaches";
import type { ForecastData } from "@/app/types/forecast";
import { calculateBeachScore } from "@/app/lib/scoreUtils";

interface ScoredBeach {
  beach: Beach;
  score: number;
}

interface BeachWithScore extends Beach {
  score: number;
}

interface BeachScore {
  score: number;
  region: string;
}

export function sortBeachesByScore(
  beaches: BeachWithScore[]
): BeachWithScore[] {
  return [...beaches].sort((a, b) => b.score - a.score);
}

export function filterGoodBeaches(
  beachScores: Record<string, BeachScore>,
  date: string,
  minScore = 4
) {
  return Object.entries(beachScores)
    .filter(([_, { score }]) => score >= minScore)
    .map(([beachId, { score, region }]) => ({
      beachId,
      region,
      score,
      date,
      conditions: {},
    }));
}
