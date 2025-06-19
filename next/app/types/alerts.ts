import { ForecastA, LogEntry, Alert, AlertProperty, Region, Prisma, AlertType } from "@prisma/client";

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
  swellSize: { min: number; max: number };
  optimalWindDirections: string[];
  idealSwellPeriod: { min: number; max: number };
  optimalSwellDirections: { min: number; max: number; cardinal: string };
}

// Export Prisma types directly
export type { Alert, AlertType, AlertProperty } from "@prisma/client";

// Use Prisma's types for operations
export type AlertCreate = Prisma.AlertCreateInput;
export type AlertUpdate = Prisma.AlertUpdateInput;

export type AlertStarRating = "3+" | "4+" | "5";

// Create input types for creation/updates (without auto-generated fields)
export type CreateAlertInput = Omit<Alert, "id"> & {
  properties: Omit<AlertProperty, "id" | "alertId">[];
};

// For creating new properties, use:
type AlertPropertyCreateInput = Prisma.AlertPropertyCreateInput;

// Extended Alert type with populated relations (for display purposes)
export interface AlertWithRelations extends Alert {
  region?: Region;
  properties: AlertProperty[];
  logEntry?: LogEntry | null;
  forecast?: ForecastA | null;
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
  forecast: ForecastA | null;
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
