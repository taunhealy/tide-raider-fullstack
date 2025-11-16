import { getLatestConditions } from "@/app/lib/forecast-utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Calculate daily scores for all regions
 * Now uses backend API instead of Prisma directly
 */
export async function calculateDailyScores() {
  try {
    // Get regions from backend
    const regionsResponse = await fetch(`${BACKEND_URL}/api/regions`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!regionsResponse.ok) {
      throw new Error("Failed to fetch regions from backend");
    }

    const regionsData = await regionsResponse.json();
    const regions = Array.isArray(regionsData) ? regionsData : regionsData.regions || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const region of regions) {
      try {
        // Get forecast from backend API
        const forecast = await getLatestConditions(false, region.id);

        if (!forecast) {
          console.log(`No forecast for region ${region.id}`);
          continue;
        }

        // Call backend API to calculate scores
        const response = await fetch(`${BACKEND_URL}/api/beach-ratings/calculate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Note: This might need authentication token
          },
          body: JSON.stringify({
            regionId: region.id,
            date: today.toISOString(),
            forecast: {
              windSpeed: forecast.windSpeed,
              windDirection: forecast.windDirection,
              swellHeight: forecast.swellHeight,
              swellPeriod: forecast.swellPeriod,
              swellDirection: forecast.swellDirection,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Backend API returned ${response.status}`);
        }

        console.log(`Successfully calculated scores for region ${region.id}`);
      } catch (error) {
        console.error(`Failed for region ${region.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to calculate daily scores:", error);
    throw error;
  }
}
