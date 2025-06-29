import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { randomUUID } from "crypto";
import {} from "@/app/lib/surfUtils";

import { redis } from "@/app/lib/redis";
import { CoreForecastData, BaseForecastData } from "@/app/types/forecast";
import { REGION_CONFIGS } from "@/app/lib/scrapers/scrapeSources";
import { scraperA } from "@/app/lib/scrapers/scraperA";
import { ScoreService } from "@/app/services/scores/ScoreService";
import { ForecastService } from "@/app/services/forecasts/ForecastService";

function getTodayDate() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

// Add these constants at the top
const REDIS_KEYS = {
  RATE_LIMIT: (region: string) => `rate-limit:${region}`,
  CACHE: (region: string, date: string) => `surf-conditions:${region}:${date}`,
  SCRAPE_LOCK: (date: string) => `scrape-lock:${date}`,
};

const CACHE_TIMES = {
  RATE_LIMIT: 60 * 60, // 1 hour rate limit window
  getRedisExpiry: () => {
    const now = new Date();
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );
    // Get seconds until end of day
    return Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
  },
  SCRAPE_LOCK: 60 * 2, // 2 minute scrape lock
};

export async function getLatestConditions(
  forceRefresh = false,
  regionId: string
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
    throw new Error(`Invalid region configuration for ${region.id}`);
  }

  try {
    console.log("Attempting to scrape from:", regionConfig.sourceA.url);
    const scrapedForecast: BaseForecastData = await scraperA(
      regionConfig.sourceA.url,
      region.id
    );

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
    throw error;
  }
}

// Add rate limit helper
async function checkRateLimit(region: string): Promise<boolean> {
  const key = REDIS_KEYS.RATE_LIMIT(region);
  const limit = await redis.incr(key);

  if (limit === 1) {
    // Set expiry on first request
    await redis.expire(key, CACHE_TIMES.RATE_LIMIT);
  }

  // Allow 30 requests per hour per region
  return limit <= 30;
}

// Add this function to implement request deduplication
async function dedupedEnsureBeachScores(
  regionId: string,
  date: Date,
  conditions: any
) {
  const lockKey = `score-lock:${regionId}:${date.toISOString().split("T")[0]}`;

  const acquired = await redis.set(lockKey, "1", {
    nx: true,
    ex: 60,
  });

  if (!acquired) {
    console.log(
      `🔒 Score generation for ${regionId} on ${date.toISOString().split("T")[0]} already in progress`
    );
    return;
  }

  try {
    const existingScores = await prisma.beachDailyScore.findMany({
      where: {
        date: date,
        regionId: regionId,
      },
      select: {
        score: true,
      },
    });

    if (
      existingScores.length === 0 ||
      existingScores.every((s) => s.score === 0)
    ) {
      console.log(
        `🔄 No valid scores found for ${regionId} on ${date}, generating...`
      );
      await ScoreService.calculateAndStoreScores(regionId, {
        ...conditions,
        date: date,
      });
    } else {
      console.log(`✅ Scores already exist for ${regionId} on ${date}`);
    }
  } catch (error) {
    console.error("Score generation failed:", error);
  } finally {
    await redis.del(lockKey);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionId = searchParams.get("regionId")?.toLowerCase();
  const dateParam = searchParams.get("date");
  const searchQuery = searchParams.get("searchQuery") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  // Use provided date or fallback to today
  const targetDate = dateParam ? new Date(dateParam) : getTodayDate();
  targetDate.setUTCHours(0, 0, 0, 0);

  // If no regionId is provided, return all beaches
  if (!regionId) {
    try {
      const beaches = await prisma.beach.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where: {
          name: searchQuery
            ? {
                contains: searchQuery,
                mode: "insensitive",
              }
            : undefined,
        },
        include: {
          region: {
            include: {
              country: true,
            },
          },
        },
      });

      const totalCount = await prisma.beach.count({
        where: {
          name: searchQuery
            ? {
                contains: searchQuery,
                mode: "insensitive",
              }
            : undefined,
        },
      });

      return NextResponse.json({
        beaches,
        pagination: {
          total: totalCount,
          page,
          limit,
          hasMore: page * limit < totalCount,
        },
      });
    } catch (error) {
      console.error("Error fetching beaches:", error);
      return NextResponse.json(
        { error: "Failed to fetch beaches" },
        { status: 500 }
      );
    }
  }

  // Check if regionId exists and is valid
  const region = await prisma.region.findUnique({
    where: { id: regionId },
  });

  if (!region) {
    return NextResponse.json(
      { error: `Region '${regionId}' not found` },
      { status: 404 }
    );
  }

  // Add rate limiting
  if (!(await checkRateLimit(regionId))) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    // 1. Get/create forecast
    const forecast = await ForecastService.getOrCreateForecast(regionId);

    // 2. Calculate and store scores (with Redis deduplication)
    await dedupedEnsureBeachScores(regionId, targetDate, forecast);

    // 4. Now get the scores after they're stored
    const { scores, beaches, totalCount } =
      await ScoreService.getBeachesWithScores({
        regionId,
        date: targetDate,
        searchQuery,
      });

    const cacheKey = `scored-beaches:${regionId}:${targetDate.toISOString().split("T")[0]}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === "string") {
      try {
        return NextResponse.json(JSON.parse(cached));
      } catch (e) {
        console.warn("Cache parse error:", e);
      }
    }

    // Prepare result
    const result = {
      forecast,
      scores,
      beaches,
      pagination: {
        total: totalCount,
        page,
        limit,
        hasMore: page * limit < totalCount,
      },
    };

    // Store in cache as string
    try {
      await redis.set(cacheKey, JSON.stringify(result), {
        ex: 900, // 15 minutes expiration
      });
    } catch (e) {
      console.warn("Cache set error:", e);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
