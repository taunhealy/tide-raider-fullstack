// types/filters.ts
import { Beach, WaveType, Difficulty, CrimeLevel } from "@/app/types/beaches";

// Base filter types
export type FilterType =
  | "waveTypes"
  | "difficulty"
  | "optimalTide"
  | "bestSeasons"
  | "crimeLevel"
  | "hasSharkAlert"
  | "hasCoffeeShop"
  | "sharkAttack"
  | "minPoints"
  | "regionId"
  | "searchQuery"
  | "country"
  | "continent"
  | "hazards";

// The complete filters interface that can be used across the app
export interface Filters {
  regionId: LocationFilter["regionId"];
  searchQuery: string;
  waveTypes: WaveType[]; // Use proper type
  difficulty: Difficulty[]; // Use proper type
  optimalTide: string[];
  bestSeasons: string[];
  crimeLevel: CrimeLevel[]; // Use proper type
  hasSharkAlert: boolean;
  hasCoffeeShop: boolean;
  sharkAttack: boolean;
  minPoints: number;
  country: string;
  continent: string;
  hazards: string[];
}

export interface FilterConfig {
  key: FilterType;
  type: "array" | "boolean" | "number" | "string";
  label: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  urlParam: string;
  beachProp: keyof Beach;
  displayNames?: Record<string, string>;
}

export interface LocationFilter {
  region: string;
  regionId: string | null;
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

export type FilterValue = string[] | boolean | number | string;

export interface BeachFilters {
  difficulty?: Difficulty[];
  waveType?: WaveType[];
  crimeLevel?: string[];
  isHiddenGem?: boolean;
  // ... other filter types
}
