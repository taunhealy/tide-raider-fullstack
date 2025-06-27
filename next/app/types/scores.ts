// next/app/types/scores.ts
import { ForecastA } from "@prisma/client";
import { Beach } from "./beaches";

export interface BeachScore {
  score: number;
  beach: {
    beachDailyScores: Array<{
      conditions: {
        windSpeed: number;
        windDirection: number;
        swellHeight: number;
        swellDirection: number;
        swellPeriod: number;
      };
      date: string;
    }>;
  };
}

export type BeachScoreMap = Record<string, BeachScore>;

export interface BeachWithScore extends Omit<Beach, "isHiddenGem"> {
  score: number;
  isHiddenGem?: boolean | null;
}
