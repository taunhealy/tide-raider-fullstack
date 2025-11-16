import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { CoreForecastData } from "@/app/types/forecast";
import { ForecastA } from "@prisma/client";
import { LocationFilter } from "@/app/types/filters";

function getTodayDate() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

// Commented out Redis constants
// const REDIS_KEYS = {
//   RATE_LIMIT: (region: string) => `rate-limit:${region}`,
//   CACHE: (region: string, date: string) => `surf-conditions:${region}:${date}`,
//   SCRAPE_LOCK: (date: string) => `scrape-lock:${date}`,
// };

// const CACHE_TIMES = {
//   RATE_LIMIT: 60 * 60, // 1 hour rate limit window
//   getRedisExpiry: () => {
//     const now = new Date();
//     const endOfDay = new Date(
//       now.getFullYear(),
//       now.getMonth(),
//       now.getDate(),
//       23,
//       59,
//       59
//     );
//     // Get seconds until end of day
//     return Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
//   },
//   SCRAPE_LOCK: 60 * 2, // 2 minute scrape lock
//   SCORES: 900, // 15 minutes cache for scores
// };

/**
 * Get latest forecast conditions for a region
 * This function now calls the backend API instead of using Prisma directly
 * The backend handles region lookup, caching, and scraping
 */
export async function getLatestConditions(
  forceRefresh = false,
  regionId: ForecastA["regionId"]
): Promise<CoreForecastData> {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

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

// Commented out rate limit helper
// async function checkRateLimit(region: string): Promise<boolean> {
//   const key = REDIS_KEYS.RATE_LIMIT(region);
//   const limit = await redis.incr(key);

//   if (limit === 1) {
//     // Set expiry on first request
//     await redis.expire(key, CACHE_TIMES.RATE_LIMIT);
//   }

//   // Increase the limit from 30 to 100 requests per hour per region
//   return limit <= 100;
// }

// Commented out request deduplication function
// async function dedupedEnsureBeachScores(
//   regionId: string,
//   date: Date,
//   conditions: any
// ) {
//   const lockKey = `score-lock:${regionId}:${date.toISOString().split("T")[0]}`;

//   const acquired = await redis.set(lockKey, "1", {
//     nx: true,
//     ex: 60,
//   });

//   if (!acquired) {
//     console.log(
//       `🔒 Score generation for ${regionId} on ${date.toISOString().split("T")[0]} already in progress`
//     );
//     return;
//   }

//   try {
//     const existingScores = await prisma.beachDailyScore.findMany({
//       where: {
//         date: date,
//         regionId: regionId,
//       },
//       select: {
//         score: true,
//       },
//     });

//     if (
//       existingScores.length === 0 ||
//       existingScores.every((s) => s.score === 0)
//     ) {
//       console.log(
//         `🔄 No valid scores found for ${regionId} on ${date}, generating...`
//       );
//       await ScoreService.calculateAndStoreScores(regionId, {
//         ...conditions,
//         date: date,
//       });
//     } else {
//       console.log(`✅ Scores already exist for ${regionId} on ${date}`);
//     }
//   } catch (error) {
//     console.error("Score generation failed:", error);
//   } finally {
//     await redis.del(lockKey);
//   }
// }

/**
 * GET /api/surf-conditions?regionId=xxx
 * This route proxies to the backend /api/filtered-beaches endpoint
 * which handles forecast fetching, score calculation, and beach filtering
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionId = searchParams.get("regionId");

  if (!regionId) {
    return NextResponse.json(
      { error: "regionId is required" },
      { status: 400 }
    );
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

  try {
    // Build backend URL with all query params
    const queryString = searchParams.toString();
    const backendApiUrl = `${backendUrl}/api/filtered-beaches${queryString ? `?${queryString}` : ""}`;

    console.log(`[surf-conditions] Proxying to backend: ${backendApiUrl}`);

    const response = await fetch(backendApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || "Failed to fetch surf conditions");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[surf-conditions] Backend error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch surf conditions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
