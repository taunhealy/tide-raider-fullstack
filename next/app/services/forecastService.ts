// next/app/services/forecastService.ts

//handling data fetching and initial processing, before the data enters Redux or the UI layer.

import {
  ForecastResponse,
  ForecastData,
  BaseForecastData,
} from "@/app/types/forecast";
import { Beach } from "@/app/types/beaches";
import { BeachScoreMap } from "@/app/types/scores";

// Fetch forecast data from API
export async function fetchForecastData(
  region: string
): Promise<ForecastResponse | null> {
  try {
    const response = await fetch(`/api/surf-conditions?region=${region}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch forecast: ${response.statusText}`);
    }

    const rawData = await response.json();

    return {
      data: rawData,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return null;
  }
}

// Process forecast data to ensure it has all required fields
export function processForecastData(rawData: any): ForecastData {
  if (!rawData) {
    throw new Error("No forecast data available");
  }

  // Ensure all required fields exist with default values if needed
  return {
    id: rawData.id || "",
    date: rawData.date ? new Date(rawData.date) : new Date(),
    region: rawData.region || "",
    windSpeed: Number(rawData.windSpeed) || 0,
    windDirection: Number(rawData.windDirection) || 0,
    swellHeight: Number(rawData.swellHeight) || 0,
    swellPeriod: Number(rawData.swellPeriod) || 0,
    swellDirection: Number(rawData.swellDirection) || 0,
    createdAt: rawData.createdAt ? new Date(rawData.createdAt) : new Date(),
    updatedAt: rawData.updatedAt ? new Date(rawData.updatedAt) : new Date(),
    forecasts: rawData.forecasts || {},
    alerts: rawData.alerts || [],
  };
}
