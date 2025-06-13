import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { randomUUID } from "crypto";
import {} from "@/app/lib/surfUtils";

import { redis } from "@/app/lib/redis";
import { BaseForecastData } from "@/app/types/forecast";
import { REGION_CONFIGS } from "@/app/lib/scrapers/scrapeSources";
import { scraperA } from "@/app/lib/scrapers/scraperA";
import { storeBeachDailyScores } from "@/app/lib/beachDailyScores";

interface RegionScrapeConfig {
  url: string;
  region: string;
}

function getTodayDate() {
  const date = new Date();
  // Set to start of day in UTC
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

// Add these constants at the top
const SCRAPE_TIMEOUT = 15000; // Reduce to 15 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const CONCURRENT_SCRAPE_LIMIT = 3; // Limit concurrent scrapes

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

type ValidRegion = (typeof REGION_CONFIGS)[number]["region"];

function isValidRegion(region: string): region is ValidRegion {
  return REGION_CONFIGS.some((config) => config.region === region);
}

function degreesToCardinal(degrees: number): string {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round((degrees % 360) / 22.5);
  return directions[index % 16];
}

async function getLatestConditions(forceRefresh = false, region: ValidRegion) {
  if (!region) {
    throw new Error("Region is required");
  }

  console.log("=== getLatestConditions ===");
  console.log("Region:", region, "Force refresh:", forceRefresh);

  // Get today's date range (UTC midnight to next day)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  // 1. Check database first with a date range for today
  const existingForecast = await prisma.forecastA.findFirst({
    where: {
      region: region,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    select: {
      id: true,
      date: true,
      region: true,
      windSpeed: true,
      windDirection: true,
      swellHeight: true,
      swellPeriod: true,
      swellDirection: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  if (existingForecast && !forceRefresh) {
    console.log("Found existing forecast:", existingForecast);
    return {
      ...existingForecast,
      windSpeed: existingForecast.windSpeed,
      windDirection: existingForecast.windDirection,
      swellHeight: existingForecast.swellHeight,
      swellPeriod: existingForecast.swellPeriod,
      swellDirection: existingForecast.swellDirection,
    };
  }

  // 2. If no data exists or force refresh, scrape and store
  console.log(
    "No existing forecast found or force refresh requested. Scraping..."
  );

  const regionConfig = REGION_CONFIGS.find(
    (config) => config.region === region
  );
  if (!regionConfig) {
    throw new Error(`Invalid region configuration for ${region}`);
  }

  try {
    console.log("Attempting to scrape from:", regionConfig.sourceA.url);
    const forecast: BaseForecastData = await scraperA(
      regionConfig.sourceA.url,
      region
    );

    if (forecast) {
      // Strip time from date
      forecast.date.setUTCHours(0, 0, 0, 0);
    }

    if (!forecast) {
      throw new Error(`Scraper returned null for ${region}`);
    }

    // Store raw degrees in DB
    const storedForecast = await prisma.forecastA.upsert({
      where: {
        date_region: {
          date: forecast.date,
          region: forecast.region,
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
        region: forecast.region,
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
    console.error(`Failed to scrape data for ${region}:`, error);
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

// Add source configurations
interface SourceConfig {
  id: "A" | "B";
  name: string;
  regions: {
    [key: string]: {
      url: string;
      scraper: (html: string) => Promise<BaseForecastData>;
    };
  };
}

export const dynamic = "force-dynamic";

async function getExistingForecast(
  source: "A" | "B",
  region: string,
  date: Date
) {
  const model = (source === "A" ? prisma.forecastA : prisma.forecastB) as any;

  return model.findFirst({
    where: {
      date: date,
      region: region,
    },
  });
}

async function getForecastsForRegion(region: ValidRegion) {
  const regionConfig = REGION_CONFIGS.find(
    (config) => config.region === region
  );
  if (!regionConfig) throw new Error("Invalid region");

  const response = await fetch(regionConfig.sourceA.url);
  const html = await response.text();
  return await scraperA(html, region);
}

// Add this function to implement request deduplication
async function dedupedEnsureBeachScores(
  region: string,
  date: Date,
  conditions: any
) {
  const lockKey = `score-lock:${region}:${date.toISOString().split("T")[0]}`;

  const acquired = await redis.set(lockKey, "1", {
    nx: true,
    ex: 60,
  });

  if (!acquired) {
    console.log(
      `🔒 Score generation for ${region} on ${date.toISOString().split("T")[0]} already in progress`
    );
    return;
  }

  try {
    const existingScores = await prisma.beachDailyScore.count({
      where: {
        date: date,
        region: region,
      },
    });

    if (existingScores === 0) {
      console.log(`🔄 No scores found for ${region} on ${date}, generating...`);
      await storeBeachDailyScores(conditions, region, date);
    } else {
      console.log(`✅ Scores already exist for ${region} on ${date}`);
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
    const conditions = await getLatestConditions(
      false,
      region.name as ValidRegion
    );
    if (!conditions) {
      return NextResponse.json(
        { error: "No conditions found" },
        { status: 404 }
      );
    }

    // Use the deduped version instead
    await dedupedEnsureBeachScores(region.name, conditions.date, conditions);

    return NextResponse.json(conditions);
  } catch (error) {
    console.error("Detailed error in GET route:", error);
    return NextResponse.json(
      { error: "Failed to fetch conditions" },
      { status: 500 }
    );
  }
}
