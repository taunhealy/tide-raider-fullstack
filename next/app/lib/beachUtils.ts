import { Beach } from "@/app/types/beaches";

export function filterBeachesByRegion(
  beaches: Beach[],
  region: string | null
): Beach[] {
  if (!beaches.length || !region) return [];
  return beaches.filter((beach) => beach.region === region);
}

export function addScoresToBeaches(
  beaches: Beach[],
  beachScores: Record<string, { score: number; suitable: boolean }>
): (Beach & { score: number; suitable: boolean })[] {
  return beaches.map((beach) => {
    const scoreInfo = beachScores[beach.id] || { score: 0, suitable: false };
    return {
      ...beach,
      score: scoreInfo.score || 0,
      suitable: scoreInfo.suitable || false,
    };
  });
}

export function sortBeachesByScore(
  beaches: (Beach & { score: number })[]
): (Beach & { score: number })[] {
  return [...beaches].sort((a, b) => b.score - a.score);
}
