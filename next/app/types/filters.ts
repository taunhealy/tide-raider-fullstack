// types/filters.ts
import { CrimeLevel, WaveType, Difficulty, Beach } from "@/app/types/beaches";

export interface LocationFilter {
  region: string;
  regionId: string;
  country: string;
  continent: string;
}

export interface RaidFilters {
  location: LocationFilter;
  waveType: WaveType[];
  difficulty: Difficulty[];
  minPoints: number;
  crimeLevel: CrimeLevel[];
  sharkAttack: string[];
  searchQuery: string;
  hasAttack: boolean;
}
