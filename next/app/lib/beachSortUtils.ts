// next/app/lib/beachSortUtils.ts
import type { Beach } from "@/app/types/beaches";

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
