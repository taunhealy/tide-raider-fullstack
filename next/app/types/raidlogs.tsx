import { Beach, Region, User, ForecastA, Alert } from "@prisma/client";
import React from "react";
import { Beach as BeachType } from "@/app/types/beaches";

export interface LogEntry {
  id: string;
  date: string;
  surferName: string | null;
  surferEmail: string | null;
  surferRating: number;
  comments: string | null;
  isPrivate: boolean;
  isAnonymous: boolean;
  waveType: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  videoPlatform: VideoPlatform | null;
  userId: string | null;
  beachName: string;
  region: {
    id: string;
    name: string;
    continent: string | null;
    country: {
      id: string;
      name: string;
      continentId: string;
    };
  };
  beach: {
    id: string;
    name: string;
    region: {
      id: string;
      name: string;
      country: {
        id: string;
        name: string;
        continentId: string;
      };
      continent: string | null;
    };
    waveType: string;
    difficulty: string;
  } | null;
  forecast: {
    id: string;
    date: string;
    windSpeed: number;
    windDirection: number;
    swellHeight: number;
    swellPeriod: number;
    swellDirection: number;
  } | null;
  user: {
    id: string;
    nationality: string | null;
    name: string;
  } | null;
  alerts: Alert[];
  hasAlert?: boolean;
  isMyAlert?: boolean;
  alertId?: string;
}

export interface RaidLogFilters {
  beaches: Array<{ id: string }>;
  regions: string[];
  countries: string[];
  minRating?: number;
  isPrivate?: boolean;
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

export type VideoPlatform = "youtube" | "vimeo";
