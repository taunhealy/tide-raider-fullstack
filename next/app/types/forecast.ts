// next/app/types/forecast.ts

import { Alert } from "@prisma/client";
import { Beach } from "./beaches";

// Base forecast data that matches Prisma ForecastA model
export interface CoreForecastData {
  windSpeed: number;
  windDirection: number;
  swellHeight: number;
  swellPeriod: number;
  swellDirection: number;
  date: Date;
  regionId: string; // matches our Prisma schema
}

export interface BaseForecastData extends CoreForecastData {
  id: string;
  date: Date;
  region: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extended forecast data that includes additional fields
export interface ForecastData extends BaseForecastData {
  forecasts?: { [date: string]: BaseForecastData };
  alerts?: Alert[]; // Matches Prisma relation
}

// Component Props types
export interface BeachContainerProps {
  initialBeaches: Beach[];
  forecastData: BaseForecastData | null | undefined;
}

// For components that need forecast data
export type ForecastDataProp = CoreForecastData | null | undefined;

// Weekly forecast type
export interface WeeklyForecast {
  [date: string]: BaseForecastData;
}

// Type for forecast responses
export interface ForecastResponse {
  data: ForecastData;
  updatedAt: Date;
}

// Type for alert-related forecast data
export interface AlertForecastData extends BaseForecastData {
  alertType?: string;
  starRating?: string;
  forecastDate: Date;
}

interface SwellDirections {
  min: number;
  max: number;
  cardinal?: string; // Make optional since not all records have it
}
