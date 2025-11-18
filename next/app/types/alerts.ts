import { Forecast } from "@/app/types/forecast";

// Only keep custom types not in Prisma
export type NotificationMethod = "email" | "whatsapp" | "app" | "both";

export type ForecastProperty =
  | "windSpeed"
  | "windDirection"
  | "swellHeight"
  | "swellPeriod"
  | "swellDirection";

// Beach details from API
export interface BeachDetails {
  id?: string;
  name?: string;
  swellSize: { min: number; max: number };
  optimalWindDirections: string[];
  idealSwellPeriod: { min: number; max: number };
  optimalSwellDirections: { min: number; max: number; cardinal: string };
}

// Type definitions (replacing Prisma imports)
export type AlertType = "VARIABLES" | "RATING";
export type AlertProperty = {
  id?: string;
  property: ForecastProperty;
  range: number;
  optimalValue?: number; // Optional, used in some contexts
};

export interface Alert {
  id: string;
  name: string;
  alertType: AlertType;
  regionId: string;
  userId: string;
  active: boolean;
  starRating: number | null;
  forecastDate: Date | null;
  notificationMethod: NotificationMethod;
  contactInfo: string;
  createdAt: Date;
  updatedAt: Date;
  logEntryId: string | null;
  forecastId: string | null;
  properties?: AlertProperty[];
}

// Type aliases for operations
export type AlertCreate = Partial<Alert>;
export type AlertUpdate = Partial<Alert>;

export type AlertStarRating = "3+" | "4+" | "5";

// Create input types for creation/updates (without auto-generated fields)
export type CreateAlertInput = Omit<Alert, "id"> & {
  properties: Omit<AlertProperty, "id" | "alertId">[];
};

// For creating new properties, use:
export type AlertPropertyCreateInput = Omit<AlertProperty, "id">;

// Extended Alert type with populated relations (for display purposes)
export interface AlertWithRelations extends Alert {
  region?: Region;
  properties: AlertProperty[];
  logEntry?: LogEntry | null;
  forecast?: Forecast | null;
}

export interface AlertConfig {
  id: string;
  name: string;
  regionId: string;
  forecastDate: Date;
  properties: AlertProperty[];
  notificationMethod: NotificationMethod;
  contactInfo: string;
  active: boolean;
  logEntry?: LogEntry | null;
  logEntryId: string | null;
  alertType: AlertType;
  starRating: number | null;
  forecast: Forecast | null;
  forecastId: string | null;
  userId: string;
}

// Use this for creating/updating alerts
export type AlertConfigTypes = AlertConfig;

export type ForecastData = {
  windSpeed: number;
  windDirection: number;
  swellHeight: number;
  swellPeriod: number;
  swellDirection: number;
  id: string;
  date: Date;
  region: string;
  createdAt: Date;
  updatedAt: Date;
} | null;

type PropertyUpdateAction = {
  index: number;
  key: "property" | "range" | "optimalValue";
  value: ForecastProperty | number;
};

export interface AlertContextState {
  alertConfig: AlertConfigTypes;
  properties: AlertProperty[];
}
