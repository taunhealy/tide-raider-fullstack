import { randomUUID } from "crypto";
import { CoreForecastData } from "@/app/types/forecast";

function getTodayDate() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/**
 * Get latest forecast conditions for a region
 * This function calls the backend API instead of using Prisma directly
 * The backend handles region lookup, caching, and scraping
 */
export async function getLatestConditions(
  forceRefresh = false,
  regionId: string
): Promise<CoreForecastData> {
  // Use NEXT_PUBLIC_API_URL if set, otherwise use environment-appropriate default
  const getBackendUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    const isDevelopment = process.env.NODE_ENV === "development";

    // In development, use localhost backend (connects to Docker postgres)
    if (isDevelopment) {
      return envUrl || "http://localhost:4001";
    }

    // In production, use production backend (connects to Fly.io postgres)
    return envUrl || "https://tide-raider-backend.fly.dev";
  };

  const backendUrl = getBackendUrl();

  const today = getTodayDate();

  try {
    console.log(
      `[getLatestConditions] Calling backend API: ${backendUrl}/api/forecast?regionId=${regionId}&forceRefresh=${forceRefresh}`
    );

    const response = await fetch(
      `${backendUrl}/api/forecast?regionId=${regionId}${forceRefresh ? "&forceRefresh=true" : ""}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      console.error(
        `[getLatestConditions] Backend API returned ${response.status}: ${response.statusText}`
      );
      // Return a default forecast instead of throwing
      return {
        id: randomUUID(),
        regionId: regionId,
        date: today,
        windSpeed: 0,
        windDirection: 0,
        swellHeight: 0,
        swellPeriod: 0,
        swellDirection: 0,
      };
    }

    const forecastData = await response.json();

    // Ensure date is a Date object
    const forecast: CoreForecastData = {
      id: forecastData.id || randomUUID(),
      regionId: forecastData.regionId || regionId,
      date: forecastData.date ? new Date(forecastData.date) : today,
      windSpeed: forecastData.windSpeed || 0,
      windDirection: forecastData.windDirection || 0,
      swellHeight: forecastData.swellHeight || 0,
      swellPeriod: forecastData.swellPeriod || 0,
      swellDirection: forecastData.swellDirection || 0,
    };

    // Normalize date to midnight UTC
    forecast.date.setUTCHours(0, 0, 0, 0);

    console.log(
      `[getLatestConditions] ✅ Successfully fetched forecast from backend API for region: ${regionId}`
    );

    return forecast;
  } catch (error) {
    console.error(
      `[getLatestConditions] ❌ Failed to fetch forecast for ${regionId}:`,
      error
    );
    // Return a default forecast instead of throwing
    return {
      id: randomUUID(),
      regionId: regionId,
      date: today,
      windSpeed: 0,
      windDirection: 0,
      swellHeight: 0,
      swellPeriod: 0,
      swellDirection: 0,
    };
  }
}

