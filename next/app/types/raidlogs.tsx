import { Beach, ForecastA } from "@prisma/client";
import React from "react";
import { Beach as BeachType } from "@/app/types/beaches";

export interface LogEntry {
  id: string;
  date: Date;
  surferName?: string | null;
  surferEmail?: string | null;
  beachName?: string | null;
  surferRating: number;
  comments?: string | null;
  isPrivate: boolean;
  isAnonymous: boolean;
  continent?: string | null;
  country?: string | null;
  region?: {
    id: string;
    name: string;
    continent: string | null;
    country: string | null;
  } | null;
  waveType?: string | null;
  beachId?: string | null;
  forecastId?: string | null;
  userId?: string | null;
  hasAlert?: boolean;
  isMyAlert?: boolean;
  alertId?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  videoPlatform?: "youtube" | "vimeo" | null;
  forecast?: {
    id: string;
    date: Date;
    region: string;
    createdAt: Date;
    updatedAt: Date;
    windSpeed: number;
    windDirection: number;
    swellHeight: number;
    swellPeriod: number;
    swellDirection: number;
  } | null;
  user?: {
    id: string;
    nationality?: string;
    name?: string;
  };
}

export interface RaidLogFilters {
  beaches: Array<{ id: string }>;
  regions: string[];
  countries: string[];
  minRating?: number;
  isPrivate?: boolean;
}

export interface CreateLogEntryInput {
  beachName: string;
  userId: string;
  date: Date;
  surferName: string;
  surferRating: number;
  comments?: string;
  imageUrl?: string;
  isPrivate?: boolean;
  beach?: {
    continent: string;
    country: string;
    region: string;
    waveType: string;
  };
  forecast?: ForecastA;
}

export interface SortConfig {
  field: keyof LogEntry;
  direction: "asc" | "desc";
}

export interface FilterConfig {
  beaches: (string | Beach)[];
  regions: string[];
  countries: string[];
  minRating: number | null;
  dateRange: { start: string; end: string };
  isPrivate: boolean;
}

export interface QuestLogTableColumn {
  key: keyof LogEntry | "forecastSummary";
  label: string;
  sortable?: boolean;
  render?: (entry: LogEntry) => React.ReactNode;
}

export type RegionFilters = {
  continents: string[];
  countries: string[];
  regions: string[];
  beaches: string[];
  waveTypes: string[];
};

export interface SurfCondition {
  id: string;
  date: string;
  region: string;
  forecast: {
    entries: Array<{
      wind: { speed: number; direction: string };
      swell: { height: number; period: number; direction: string };
      timestamp: number;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface RaidLogResponse {
  entries: LogEntry[];
  total: number;
}
