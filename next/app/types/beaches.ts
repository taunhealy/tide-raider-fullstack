export interface SharkIncident {
  hasAttack: boolean;
  incidents?: {
    date: string;
    outcome: "Fatal" | "Non-fatal" | "Unknown";
    details: string;
  }[];
  [key: string]: any;
}

export interface Region {
  id: string;
  regionId: string;
  name: string;
  countryId: string;
  country?: Country;
  continent?: string;
}

export interface Country {
  id: string;
  name: string;
  continentId: string;
  continent?: Continent;
}

export interface Continent {
  id: string;
  name: string;
}

export type Difficulty =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "EXPERT"
  | "All Levels";
export type CrimeLevel = "Low" | "Medium" | "High";

// Add this to types/beaches.ts// Update FilterType interface
export interface FilterType {
  regionId: string;
  region: string;
  country: string;
  continent: string;
  waveType: WaveType[];
  difficulty: Difficulty[];
  minPoints: number;
  crimeLevel: CrimeLevel[];
  sharkAttack: string[];
  searchQuery: string;
  hasAttack: boolean;
  optimalTide: string[];
  bestSeasons: string[];
  hasSharkAlert: boolean;
  hasCoffeeShop: boolean;
}

export const WAVE_TYPES = [
  "BEACH_BREAK",
  "POINT_BREAK",
  "REEF_BREAK",
  "RIVER_MOUTH",
] as const;

export type WaveType = (typeof WAVE_TYPES)[number];

export type OptimalTide =
  | "LOW_TO_MID"
  | "MID_TO_HIGH"
  | "LOW"
  | "MID"
  | "HIGH"
  | "ALL"
  | "UNKNOWN";

export interface Beach {
  id: string;
  name: string;
  continent: string;
  countryId: string;
  regionId: string;
  country?: Country;
  region?: Region;
  isHiddenGem?: boolean | null | undefined;
  location: string;
  distanceFromCT: number;
  optimalWindDirections: string[];
  optimalSwellDirections: {
    min: number;
    max: number;
    cardinal?: string;
  };
  sheltered?: boolean; // Made optional with ?
  bestSeasons: string[];
  optimalTide: OptimalTide;
  description: string;
  difficulty:
    | "BEGINNER"
    | "INTERMEDIATE"
    | "ADVANCED"
    | "All Levels"
    | "EXPERT";
  waveType: WaveType;
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
  crimeLevel: "Low" | "Medium" | "High";
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
    currentAds?: AdSlot[];
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
}

export interface AdSlot {
  id: string;
  imageUrl: string;
  linkUrl: string;
  companyName: string;
  contactEmail: string;
  startDate: string;
  endDate: string;
  status: "active" | "pending" | "rejected";
  rejectionReason?: string;
}

export const beachData: Beach[] = [
  // Import beach data from beachData.txt and paste it here
];

export interface BeachUI {
  id: string;
  name: string;
  waveType: string;
  difficulty: string;
  region: {
    id: string;
    name: string;
  } | null;
  country: {
    id: string;
    name: string;
  } | null;
}
