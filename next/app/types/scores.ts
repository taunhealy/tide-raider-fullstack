// next/app/types/scores.ts
import { Beach } from "./beaches";

export interface BeachScore {
  score: number;
}

export type BeachScoreMap = Record<string, BeachScore>;

export interface BeachWithScore extends Beach {
  score: number;
}
