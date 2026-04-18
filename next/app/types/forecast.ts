// next/app/types/forecast.ts

import { Beach } from "./beaches";
import { BeachScoreMap } from "./scores";

// Base forecast data with just the essential fields
export interface BaseForecastData {
  windSpeed: number;
  windDirection: number;
  swellHeight: number;
  swellPeriod: number;
  swellDirection: number;
  date: Date;
  regionId: string;
  tide?: string;
  trend?: string;
}

// Core forecast data that includes all fields from the database
export interface CoreForecastData extends BaseForecastData {
  id: string;
}

// Forecast type matching the database schema (replaces Prisma Forecast)
export interface Forecast extends CoreForecastData {
  source: "WINDFINDER" | "WINDGURU";
  createdAt?: Date;
  updatedAt?: Date;
}

// Type aliases for compatibility
export type Alert = any; // Will be defined in alerts.ts
export type LogEntry = any; // Will be defined in raidlogs.tsx

// Remove BaseForecastData and simplify to match schema
export interface ForecastData extends CoreForecastData {
  alerts?: any[];
  logEntries?: any[];
}

// Keep only essential types, remove unused ones
export type ForecastDataProp = CoreForecastData | null;

// Component Props types
export interface BeachContainerProps {
  initialBeaches: Beach[];
  forecastData: ForecastData | null | undefined;
}

// Weekly forecast type
export interface WeeklyForecast {
  [date: string]: ForecastData;
}

// Type for alert-related forecast data
export interface AlertForecastData extends ForecastData {
  alertType?: string;
  starRating?: string;
  forecastDate: Date;
}

interface SwellDirections {
  min: number;
  max: number;
  cardinal?: string; // Make optional since not all records have it
}
