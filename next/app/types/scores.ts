// next/app/types/scores.ts
import { Beach } from "./beaches";

export interface BeachScore {
  score: number;
  region: string;
}

export type BeachScoreMap = Record<string, BeachScore>;

export interface BeachWithScore extends Beach {
  score: number;
}
