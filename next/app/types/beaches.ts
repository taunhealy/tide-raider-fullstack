export interface SharkIncident {
  hasAttack: boolean;
  incidents?: {
    date: string;
    outcome: "Fatal" | "Non-fatal" | "Unknown";
    details: string;
  }[];
}

export interface Region {
  id: string;
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
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "All Levels"
  | "Expert";
export type CrimeLevel = "Low" | "Medium" | "High";

// Add this to types/beaches.ts// Update FilterType interface
export interface FilterType {
  waveType: WaveType[];
  difficulty: Difficulty[];
  location: {
    region: string; // Store region name for display
    regionId: string; // Store region ID for API calls
    country: string;
    continent: string;
  };
  crimeLevel: CrimeLevel[];
  minPoints: number;
  sharkAttack: string[];
  minDistance?: number;
  searchQuery: string;
  hasAttack: boolean;
  incidents?: {
    date: string;
    outcome: "Fatal" | "Non-fatal" | "Unknown";
    details: string;
  }[];
}

export const WAVE_TYPES = [
  "Beach Break",
  "Reef Break",
  "Point Break",
  "Beach and Reef Break",
  "Beach and Point Break",
] as const;

export type WaveType = (typeof WAVE_TYPES)[number];

// Or if using type instead of interface:

export interface Beach {
  id: string;
  name: string;
  continent: Continent;
  country: Country;
  region: Region;
  regionId: string;
  isHiddenGem?: boolean | undefined;
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
  optimalTide:
    | "Low"
    | "Mid"
    | "High"
    | "All"
    | "Low to Mid"
    | "Mid to High"
    | "unknown";
  description: string;
  difficulty:
    | "Beginner"
    | "Intermediate"
    | "Advanced"
    | "All Levels"
    | "Expert";
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
  image: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  videos?: {
    url: string;
    title: string;
    platform: "youtube" | "vimeo";
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
