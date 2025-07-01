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
import { FILTERS } from "@/app/config/filters";
import type { FilterConfig } from "@/app/config/filters";
import { BeachService } from "@/app/services/beaches/BeachService";

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
  SCORES: 900, // 15 minutes cache for scores
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

  if (!regionId) {
    return NextResponse.json(
      { error: "regionId is required" },
      { status: 400 }
    );
  }

  // Check rate limit
  if (!(await checkRateLimit(regionId))) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    // Check Redis cache
    const targetDate = searchParams.get("date")
      ? new Date(searchParams.get("date")!)
      : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const cacheKey = REDIS_KEYS.CACHE(
      regionId,
      targetDate.toISOString().split("T")[0]
    );

    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        return NextResponse.json(JSON.parse(cached as string));
      } catch (e) {
        console.warn("Cache parse error:", e);
      }
    }

    // Get filtered beaches using service
    const result = await BeachService.getFilteredBeaches(searchParams);

    // Cache result
    try {
      await redis.set(cacheKey, JSON.stringify(result), {
        ex: CACHE_TIMES.SCORES,
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
