import { Beach } from "@/app/types/beaches";

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
  | "continent";

// The complete filters interface that can be used across the app
export interface Filters {
  regionId: string;
  searchQuery: string;
  waveTypes: string[];
  difficulty: string[];
  optimalTide: string[];
  bestSeasons: string[];
  crimeLevel: string[];
  hasSharkAlert: boolean;
  hasCoffeeShop: boolean;
  sharkAttack: boolean;
  minPoints: number;
  country: string;
  continent: string;
}

export interface FilterConfig {
  key: FilterType;
  type: "array" | "boolean" | "number" | "string"; // Added string type
  label: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  urlParam: string;
  beachProp: keyof Beach;
}

export const FILTERS: FilterConfig[] = [
  {
    key: "waveTypes",
    type: "array",
    label: "Wave Type",
    options: ["BEACH_BREAK", "POINT_BREAK", "REEF_BREAK", "RIVER_MOUTH"],
    urlParam: "waveTypes",
    beachProp: "waveType",
  },
  {
    key: "difficulty",
    type: "array",
    label: "Difficulty",
    options: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"],
    urlParam: "difficulty",
    beachProp: "difficulty",
  },
  {
    key: "optimalTide",
    type: "array",
    label: "Optimal Tide",
    options: ["LOW", "MID", "HIGH", "ALL", "LOW_TO_MID", "MID_TO_HIGH"],
    urlParam: "optimalTide",
    beachProp: "optimalTide",
  },
  {
    key: "bestSeasons",
    type: "array",
    label: "Best Season",
    options: ["Summer", "Autumn", "Winter", "Spring"],
    urlParam: "bestSeasons",
    beachProp: "bestSeasons",
  },
  {
    key: "crimeLevel",
    type: "array",
    label: "Crime Level",
    options: ["Low", "Medium", "High"],
    urlParam: "crimeLevel",
    beachProp: "crimeLevel",
  },
  {
    key: "hasSharkAlert",
    type: "boolean",
    label: "Shark Alert System",
    urlParam: "hasSharkAlert",
    beachProp: "hasSharkAlert",
  },
  {
    key: "hasCoffeeShop",
    type: "boolean",
    label: "Coffee Shop",
    urlParam: "hasCoffeeShop",
    beachProp: "coffeeShop",
  },
  {
    key: "minPoints",
    type: "number",
    label: "Minimum Rating",
    min: 0,
    max: 5,
    step: 0.5,
    urlParam: "minPoints",
    beachProp: "id" as keyof Beach,
  },
];
