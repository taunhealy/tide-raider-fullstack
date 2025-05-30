// next/app/types/scores.ts
export interface BeachScore {
    score: number;
    suitable: boolean;
  }
  
  export type BeachScoreMap = Record<string, BeachScore>;