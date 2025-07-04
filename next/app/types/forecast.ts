// next/app/types/forecast.ts

import { Alert, LogEntry } from "@prisma/client";
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
}

// Core forecast data that includes all fields from the database
export interface CoreForecastData extends BaseForecastData {
  id: string;
}

// Remove BaseForecastData and simplify to match schema
export interface ForecastData extends CoreForecastData {
  alerts?: Alert[];
  logEntries?: LogEntry[];
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
