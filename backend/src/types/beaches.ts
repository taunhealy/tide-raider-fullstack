// Simplified Beach type for backend seed script
// Based on next/app/types/beaches.ts but adapted for backend use

export interface SharkIncident {
  hasAttack: boolean;
  risk?: "None" | "Low" | "Moderate" | "High" | "Extreme";
  incidents?: {
    date: string;
    outcome: "Fatal" | "Non-fatal" | "Unknown";
    details: string;
  }[];
  [key: string]: any;
}

export type Difficulty =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "EXPERT"
  | "All Levels";
export type WaveType =
  | "BEACH_BREAK"
  | "POINT_BREAK"
  | "REEF_BREAK"
  | "RIVER_MOUTH";
export type OptimalTide =
  | "LOW_TO_MID"
  | "MID_TO_HIGH"
  | "LOW"
  | "MID"
  | "HIGH"
  | "ALL"
  | "UNKNOWN";
export type CrimeLevel = "Low" | "Medium" | "High";

export interface Beach {
  id: string;
  name: string;
  continent: string;
  countryId: string;
  regionId: string;
  location: string;
  distanceFromCT: number;
  optimalWindDirections: string[];
  optimalSwellDirections: {
    min: number;
    max: number;
    cardinal?: string;
  };
  sheltered?: boolean;
  bestSeasons: string[];
  optimalTide: OptimalTide | string;
  description: string;
  difficulty: Difficulty | string;
  waveType: WaveType | string;
  swellSize: {
    min: number;
    max: number;
  };
  idealSwellPeriod: {
    min: number;
    max: number;
  };
  waterTemp: {
    summer: number;
    winter: number;
  };
  hazards: string[];
  crimeLevel: CrimeLevel | string;
  sharkAttack: SharkIncident;
  image?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  videos?: {
    url: string;
    title: string;
    platform: "youtube" | "vimeo";
    [key: string]: any;
  }[];
  profileImage?: string;
  advertisingPrice?: number;
  advertising?: {
    pricePerMonth: number;
    maxSlots: number;
    currentAds?: any[];
  };
  coffeeShop?: {
    name: string;
  }[];
  shaper?: {
    name: string;
    url?: string;
  }[];
  beer?: {
    name: string;
    url?: string;
  }[];
  hasSharkAlert?: boolean;
  bestMonthOfYear?: string;
  isHiddenGem?: boolean | null | undefined;
  isFoiling?: boolean;
  isLongboarding?: boolean;
}
