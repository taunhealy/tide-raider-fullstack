import { NextResponse } from "next/server";
import { getLatestConditions } from "@/app/lib/forecast-utils";

// Use NEXT_PUBLIC_API_URL if set, otherwise use environment-appropriate default
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDevelopment = process.env.NODE_ENV === "development";

  // In development, use localhost backend (connects to Docker postgres)
  if (isDevelopment) {
    return envUrl || "http://localhost:4050";
  }

  // In production, use production backend (connects to Fly.io postgres)
  return envUrl || "https://tide-raider-backend.fly.dev";
};

const BACKEND_URL = getBackendUrl();

// Use Node.js runtime for puppeteer/chromium support
export const runtime = "nodejs";

/**
 * Cron job to calculate scores for all regions
 * Now calls backend API instead of using Prisma directly
 */
export async function GET(request: Request) {
  try {
    // Get all regions from backend
    const regionsResponse = await fetch(`${BACKEND_URL}/api/regions`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!regionsResponse.ok) {
      throw new Error("Failed to fetch regions from backend");
    }

    const regionsData = await regionsResponse.json();
    const regions = Array.isArray(regionsData) ? regionsData : regionsData.regions || [];

    console.log(`Found ${regions.length} regions to process`);

    let successCount = 0;
    let errorCount = 0;

    // Process each region sequentially to avoid overwhelming the backend
    for (const region of regions) {
      try {
        console.log(`Processing region: ${region.name} (${region.id})`);

        // Get latest conditions for the region (this calls backend API)
        const conditions = await getLatestConditions(false, region.id);

        if (!conditions) {
          console.log(
            `No conditions found for region ${region.id}, skipping...`
          );
          errorCount++;
          continue;
        }

        // Call backend API to calculate scores
        const calculateResponse = await fetch(
          `${BACKEND_URL}/api/beach-ratings/calculate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Note: Cron jobs might need a system token or be called from backend
              // For now, this will fail if auth is required
            },
            body: JSON.stringify({
              regionId: region.id,
              date: conditions.date,
              forecast: {
                windSpeed: conditions.windSpeed,
                windDirection: conditions.windDirection,
                swellHeight: conditions.swellHeight,
                swellPeriod: conditions.swellPeriod,
                swellDirection: conditions.swellDirection,
              },
            }),
          }
        );

        if (!calculateResponse.ok) {
          const error = await calculateResponse.json().catch(() => ({
            error: `HTTP ${calculateResponse.status}`,
          }));
          throw new Error(error.error || "Failed to calculate scores");
        }

        console.log(`Successfully processed region ${region.id}`);
        successCount++;
      } catch (error) {
        console.error(`Error processing region ${region.id}:`, error);
        errorCount++;
        // Continue with next region even if one fails
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${regions.length} regions`,
      successCount,
      errorCount,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Failed to process regions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
