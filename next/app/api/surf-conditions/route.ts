import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { randomUUID } from "crypto";
import {} from "@/app/lib/surfUtils";

import { redis } from "@/app/lib/redis";
import { BaseForecastData } from "@/app/types/forecast";
import { REGION_CONFIGS } from "@/app/lib/scrapers/scrapeSources";
import { scraperA } from "@/app/lib/scrapers/scraperA";
import { storeBeachDailyScores } from "@/app/lib/beachDailyScores";

function getTodayDate() {
  const date = new Date();
  // Set to start of day in UTC
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

  // Use the forecasts route instead of direct database query
  const response = await fetch(
    `/api/forecasts?` +
      new URLSearchParams({
        date: today.toISOString().split("T")[0],
        regionId: region.id,
      })
  );

  const existingForecast = response.ok ? await response.json() : null;

  if (existingForecast && !forceRefresh) {
    console.log("Found existing forecast:", existingForecast);
    return existingForecast;
  }

  // 2. If no data exists or force refresh, scrape and store
  console.log(
    "No existing forecast found or force refresh requested. Scraping..."
  );

  const regionConfig = REGION_CONFIGS[region.id];
  if (!regionConfig) {
    throw new Error(`Invalid region configuration for ${region.id}`);
  }

  try {
    console.log("Attempting to scrape from:", regionConfig.sourceA.url);
    const forecast: BaseForecastData = await scraperA(
      regionConfig.sourceA.url,
      region.id
    );

    if (forecast) {
      // Strip time from date
      forecast.date.setUTCHours(0, 0, 0, 0);
    }

    if (!forecast) {
      throw new Error(`Scraper returned null for ${region.id}`);
    }

    // Store raw degrees in DB
    const storedForecast = await prisma.forecastA.upsert({
      where: {
        date_regionId: {
          date: forecast.date,
          regionId: region.id,
        },
      },
      update: {
        windSpeed: forecast.windSpeed,
        windDirection: forecast.windDirection,
        swellHeight: forecast.swellHeight,
        swellPeriod: forecast.swellPeriod,
        swellDirection: forecast.swellDirection,
      },
      create: {
        id: randomUUID(),
        date: forecast.date,
        regionId: region.id,
        windSpeed: forecast.windSpeed,
        windDirection: forecast.windDirection,
        swellHeight: forecast.swellHeight,
        swellPeriod: forecast.swellPeriod,
        swellDirection: forecast.swellDirection,
      },
    });

    console.log("Successfully stored forecast:", storedForecast);

    // Return with cardinal direction
    return {
      ...storedForecast,
      windSpeed: storedForecast.windSpeed,
      windDirection: storedForecast.windDirection,
      swellHeight: storedForecast.swellHeight,
      swellPeriod: storedForecast.swellPeriod,
      swellDirection: storedForecast.swellDirection,
    };
  } catch (error) {
    console.error(`Failed to scrape data for ${region.id}:`, error);
    throw error; // Re-throw to be handled by the GET route
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
    const existingScores = await prisma.beachDailyScore.count({
      where: {
        date: date,
        regionId: regionId,
      },
    });

    if (existingScores === 0) {
      console.log(
        `🔄 No scores found for ${regionId} on ${date}, generating...`
      );
      await storeBeachDailyScores(conditions, regionId, date);
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
  const regionId = searchParams.get("regionId");
  const date = searchParams.get("date") || getTodayDate().toISOString();

  // Get the region data first
  const region = await prisma.region.findUnique({
    where: { id: regionId || "" },
  });

  if (!region) {
    return NextResponse.json(
      { error: "Invalid or missing region" },
      { status: 400 }
    );
  }

  console.log(`=== Starting GET request for ${region.name} ===`);

  try {
    let forecast = await prisma.forecastA.findFirst({
      where: {
        date: new Date(date),
        regionId: region.id,
      },
    });

    if (!forecast) {
      try {
        const newForecast = await getLatestConditions(true, region.id);
        // Get the complete forecast with all fields from the database
        forecast = await prisma.forecastA.findFirst({
          where: {
            id: newForecast.id,
          },
        });
      } catch (scrapeError) {
        // ... error handling stays the same ...
      }
    }

    if (!forecast) {
      return NextResponse.json(
        { error: "No conditions found" },
        { status: 404 }
      );
    }

    // Use the deduped version instead
    await dedupedEnsureBeachScores(region.id, forecast.date, forecast);

    return NextResponse.json(forecast);
  } catch (error) {
    console.error("Detailed error in GET route:", error);
    return NextResponse.json(
      { error: "Failed to fetch conditions" },
      { status: 500 }
    );
  }
}
