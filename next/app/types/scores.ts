// next/app/types/scores.ts
import { ForecastA } from "@prisma/client";
import { Beach } from "./beaches";

export interface BeachScore {
  score: number;
  region: string;
  conditions: Pick<ForecastA, 'windSpeed' | 'windDirection' | 'swellHeight' | 'swellDirection' | 'swellPeriod'>
}

export type BeachScoreMap = Record<string, BeachScore>;

export interface BeachWithScore extends Omit<Beach, "isHiddenGem"> {
  score: number;
  isHiddenGem?: boolean | null;
}
