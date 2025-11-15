import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { randomUUID } from "crypto";
import {} from "@/app/lib/surfUtils";

// import { redis } from "@/app/lib/redis"; // Commented out redis import
import { CoreForecastData, BaseForecastData } from "@/app/types/forecast";
import { REGION_CONFIGS } from "@/app/lib/scrapers/scrapeSources";
import { scraperA } from "@/app/lib/scrapers/scraperA";
import { ScoreService } from "@/app/services/scores/ScoreService";
// import { BeachService } from "@/app/services/beaches/BeachService"; // Commented out BeachService import
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

export async function getLatestConditions(
  forceRefresh = false,
  regionId: ForecastA["regionId"]
) {
  // Get the region from the database
  const region = await prisma.region.findUnique({
    where: { id: regionId },
  });

  if (!region) {
    throw new Error("Invalid region ID");
  }

  console.log("=== getLatestConditions ===");
  console.log("Region:", region, "Force refresh:", forceRefresh);

  const today = getTodayDate();

  // Direct database query instead of API call
  const existingForecast = await prisma.forecastA.findFirst({
    where: {
      date: today,
      regionId: region.id,
    },
  });

  if (existingForecast) {
    console.log("Found existing forecast:", existingForecast);
    return existingForecast;
  }

  // Only create new forecast if none exists
  console.log("No existing forecast found. Scraping...");

  const regionConfig = REGION_CONFIGS[region.id];
  if (!regionConfig) {
    console.error(`Missing region configuration for ${region.id}`);
    // Return a default forecast instead of throwing
    return {
      id: randomUUID(),
      regionId: region.id,
      date: today,
      windSpeed: 0,
      windDirection: 0,
      swellHeight: 0,
      swellPeriod: 0,
      swellDirection: 0,
    };
  }

  try {
    console.log("Attempting to scrape from:", regionConfig.sourceA.url);
    const scrapedForecast: BaseForecastData = await scraperA(
      regionConfig.sourceA.url,
      region.id
    );

    // More detailed logging
    console.log("Scraped forecast data:", scrapedForecast);

    if (scrapedForecast) {
      // Strip time from date
      scrapedForecast.date.setUTCHours(0, 0, 0, 0);
    }

    if (!scrapedForecast) {
      throw new Error(`Scraper returned null for ${region.id}`);
    }

    // Store raw degrees in DB
    const storedForecast = await prisma.forecastA.upsert({
      where: {
        date_regionId: {
          date: scrapedForecast.date,
          regionId: scrapedForecast.regionId,
        },
      },
      update: {
        windSpeed: scrapedForecast.windSpeed,
        windDirection: scrapedForecast.windDirection,
        swellHeight: scrapedForecast.swellHeight,
        swellPeriod: scrapedForecast.swellPeriod,
        swellDirection: scrapedForecast.swellDirection,
      },
      create: {
        id: randomUUID(),
        date: scrapedForecast.date,
        regionId: scrapedForecast.regionId,
        windSpeed: scrapedForecast.windSpeed,
        windDirection: scrapedForecast.windDirection,
        swellHeight: scrapedForecast.swellHeight,
        swellPeriod: scrapedForecast.swellPeriod,
        swellDirection: scrapedForecast.swellDirection,
      },
      select: {
        id: true,
        regionId: true,
        date: true,
        windSpeed: true,
        windDirection: true,
        swellHeight: true,
        swellPeriod: true,
        swellDirection: true,
      },
    });

    // Return the full CoreForecastData
    const forecast: CoreForecastData = {
      ...storedForecast,
      id: storedForecast.id,
    };

    return forecast;
  } catch (error) {
    console.error(`Failed to scrape data for ${region.id}:`, error);
    // Return a default forecast instead of throwing
    return {
      id: randomUUID(),
      regionId: region.id,
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionId = searchParams.get("regionId")?.toLowerCase() as NonNullable<
    LocationFilter["regionId"]
  >;

  if (!regionId) {
    return NextResponse.json(
      { error: "regionId is required" },
      { status: 400 }
    );
  }

  // Commented out rate limit check
  // if (
  //   !(await checkRateLimit(regionId)) &&
  //   process.env.NODE_ENV === "production"
  // ) {
  //   return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  // }

  try {
    const targetDate = searchParams.get("date")
      ? new Date(searchParams.get("date")!)
      : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    // Step 1: Get or scrape forecast data FIRST
    let forecast: ForecastA | null = null;
    try {
      forecast = await getLatestConditions(false, regionId);
      console.log("Forecast fetched:", forecast ? "✓" : "✗");
    } catch (error) {
      console.error("Failed to fetch forecast data:", error);
    }

    // Step 2: Check if scores exist for today
    const existingScores = await prisma.beachDailyScore.count({
      where: {
        regionId,
        date: targetDate,
      },
    });

    // Step 3: Only calculate scores if they don't exist AND we have forecast data
    if (existingScores === 0 && forecast) {
      console.log(
        `Calculating scores for ${regionId} on ${targetDate.toISOString().split("T")[0]}...`
      );
      try {
        await ScoreService.calculateAndStoreScores(regionId, {
          ...forecast,
          date: targetDate,
        });
        console.log("✓ Scores calculated and stored");
      } catch (error) {
        console.error("Failed to calculate scores:", error);
      }
    } else {
      console.log(
        `✓ Using existing scores (${existingScores} beaches) for ${regionId}`
      );
    }

    // Step 4: Get beaches with their scores (no recalculation)
    const searchQuery = searchParams.get("searchQuery") || undefined;
    const filters = {}; // Parse any additional filters from searchParams

    const result = await ScoreService.getBeachesWithScores({
      regionId,
      date: targetDate,
      searchQuery,
      filters,
    });

    // Return the complete response
    const responseData = {
      beaches: result.beaches,
      scores: result.scores,
      forecast: forecast,
      totalCount: result.totalCount,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
