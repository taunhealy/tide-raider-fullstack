/**
 * Shared types between frontend and backend
 * These should match the types in next/app/types/
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isSubscribed?: boolean;
  hasActiveTrial?: boolean;
  trialEndDate?: Date | null;
}

export interface Beach {
  id: string;
  name: string;
  regionId: string;
  // Add other beach properties as needed
}

export interface Region {
  id: string;
  name: string;
  // Add other region properties as needed
}

export interface BaseForecastData {
  regionId: string;
  date: Date;
  windSpeed: number;
  windDirection: number;
  swellHeight: number;
  swellPeriod: number;
  swellDirection: number;
  tide?: string;
  trend?: string;
}
