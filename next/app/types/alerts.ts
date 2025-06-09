import { LogEntry } from "@/app/types/raidlogs";
import type { ForecastA } from "@prisma/client";

export type ForecastProperty =
  | "windSpeed"
  | "windDirection"
  | "swellHeight"
  | "swellPeriod"
  | "swellDirection"
  | "waveHeight"
  | "wavePeriod"
  | "temperature";

export type AlertStarRating = "4+" | "5";

export type NotificationMethod = "email" | "whatsapp" | "app";

export interface Alert {
  id: string;
  name: string;
  region: string;
  forecastDate: Date;
  properties: any;
  notificationMethod: string;
  contactInfo: string;
  active: boolean;
  userId: string;
  logEntryId?: string | null;
  alertType: string;
  starRating?: string | null;
  forecastId?: string | null;
  logEntry?: LogEntry | null;
  forecast?: ForecastA | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertProperty {
  property: ForecastProperty;
  range: number;
}

export interface AlertConfig {
  id: string;
  name: string;
  region: string | null;
  forecastDate: Date;
  properties: AlertProperty[];
  notificationMethod: NotificationMethod;
  contactInfo: string;
  active: boolean;
  logEntry?: LogEntry | null;
  logEntryId: string | null;
  alertType: "variables" | "rating";
  starRating: "4+" | "5" | null;
  forecast: ForecastA | null;
  forecastId: string | null;
  userId: string;
}

// Use this for creating/updating alerts
export type AlertConfigTypes = AlertConfig;

export interface ForecastData {
  windSpeed: number;
  windDirection: number;
  swellHeight: number;
  swellPeriod: number;
  swellDirection: number;
}
