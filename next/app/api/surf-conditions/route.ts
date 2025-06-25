import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { randomUUID } from "crypto";
import {} from "@/app/lib/surfUtils";

import { redis } from "@/app/lib/redis";
import { BaseForecastData, CoreForecastData } from "@/app/types/forecast";
import { REGION_CONFIGS } from "@/app/lib/scrapers/scrapeSources";
import { scraperA } from "@/app/lib/scrapers/scraperA";
import { ScoreService } from "@/app/services/scores/ScoreService";

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

  // Direct database query instead of API call
  const existingForecast = await prisma.forecastA.findFirst({
    where: {
      date: today,
      regionId: region.id,
    },
  });

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
    const forecast: CoreForecastData = await scraperA(
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
          regionId: forecast.regionId,
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
        regionId: forecast.regionId,
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
      console.log("No forecast found in database, attempting to scrape...");
      try {
        const newForecast = await getLatestConditions(true, region.id);
        forecast = await prisma.forecastA.findFirst({
          where: {
            id: newForecast.id,
          },
        });
      } catch (scrapeError) {
        console.error("Scraping failed:", scrapeError);
        return NextResponse.json(
          { error: "Failed to fetch conditions" },
          { status: 500 }
        );
      }
    }

    if (!forecast) {
      return NextResponse.json(
        { error: "No conditions found" },
        { status: 404 }
      );
    }

    await dedupedEnsureBeachScores(region.id, forecast.date, forecast);

    // Get both scores and beaches in parallel for better performance
    const [scores, beaches] = await Promise.all([
      prisma.beachDailyScore.findMany({
        where: {
          date: forecast.date,
          regionId: region.id,
        },
        select: {
          beachId: true,
          score: true,
        },
      }),
      prisma.beach.findMany({
        where: {
          regionId: region.id,
        },
        include: {
          region: true,
        },
      }),
    ]);

    // Calculate scores
    const beachScores = Object.fromEntries(
      scores.map((score) => [
        score.beachId,
        {
          score: score.score,
          region: region.id,
          conditions: {
            windSpeed: forecast.windSpeed,
            windDirection: forecast.windDirection,
            swellHeight: forecast.swellHeight,
            swellDirection: forecast.swellDirection,
            swellPeriod: forecast.swellPeriod,
          },
        },
      ])
    );

    // Return combined response with forecast, scores, and beaches
    return NextResponse.json({
      ...forecast,
      scores: beachScores,
      beaches,
    });
  } catch (error) {
    console.error("Detailed error in GET route:", error);
    return NextResponse.json(
      { error: "Failed to fetch conditions" },
      { status: 500 }
    );
  }
}
