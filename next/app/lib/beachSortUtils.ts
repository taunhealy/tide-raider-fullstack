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


export function sortBeachesByScore(
  beaches: BeachWithScore[]
): BeachWithScore[] {
  return [...beaches].sort((a, b) => b.score - a.score);
}
