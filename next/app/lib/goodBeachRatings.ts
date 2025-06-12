import { Beach } from "@/app/types/beaches";
import { prisma } from "@/app/lib/prisma";
import type { CoreForecastData } from "@/app/types/forecast";
import { NextResponse } from "next/server";
import { calculateBeachScore } from "@/app/lib/scoreUtils";

export async function storeGoodBeachRatings(
  forecast: any,
  region: string,
  date: Date
) {
  try {
    console.log(
      `🏖️ Rating storage started for ${region} at ${new Date().toISOString()}`
    );
    console.log("Forecast data:", forecast);

    const regionBeaches = await prisma.beach.findMany({
      where: {
        region: {
          name: region,
        },
      },
    });
    console.log(`📍 Found ${regionBeaches.length} beaches in ${region}`);

    if (regionBeaches.length === 0) {
      console.error(`❌ No beaches found for region: ${region}`);
      return 0;
    }

    // Convert forecast to expected CoreForecastData format
    const conditions: CoreForecastData = {
      windSpeed: forecast.windSpeed,
      windDirection: Number(forecast.windDirection),
      swellHeight: forecast.swellHeight,
      swellDirection: Number(forecast.swellDirection),
      swellPeriod: forecast.swellPeriod,
    };

    console.log("Processed conditions:", conditions);

    // Calculate scores and prepare data for batch insert
    const ratingsData = regionBeaches.map((beach) => {
      const beachWithTypes = {
        ...beach,
        optimalSwellDirections: beach.optimalSwellDirections as {
          min: number;
          max: number;
          cardinal?: string;
        },
        swellSize: beach.swellSize as { min: number; max: number },
        idealSwellPeriod: beach.idealSwellPeriod as {
          min: number;
          max: number;
        },
        waterTemp: beach.waterTemp as { summer: number; winter: number },
        sharkAttack: beach.sharkAttack as { hasAttack: boolean },
      };
      const { score } = calculateBeachScore(
        beachWithTypes as Beach,
        conditions
      );
      return {
        beachId: beach.id,
        region: region,
        score,
        conditions: JSON.stringify(conditions),
        date: date,
      };
    });

    // Batch insert all ratings
    await prisma.beachGoodRating.createMany({
      data: ratingsData,
      skipDuplicates: true,
    });

    console.log(
      `✅ Successfully stored ${ratingsData.length} ratings for ${region}`
    );
    return ratingsData.length;
  } catch (error) {
    console.error("💥 Critical rating storage error:", error);
    throw error;
  }
}

// Use existing ratings from database when possible
export async function getGoodBeachCount(
  region: string,
  date: Date,
  conditions?: CoreForecastData
): Promise<number> {
  // Try to get from existing ratings first
  const existingCount = await prisma.beachGoodRating.count({
    where: {
      region,
      date,
    },
  });

  if (existingCount > 0) {
    return existingCount;
  }

  return 0;
}

// Optimized to use existing ratings and reduce calculations
export async function getRegionScores(
  date: Date,
  region: string,
  conditions?: CoreForecastData
) {
  const scores: Record<string, number> = {};

  // Try to get from existing ratings first
  const existingRatings = await prisma.beachGoodRating.findMany({
    where: {
      date,
      region,
    },
  });

  if (existingRatings.length > 0) {
    // Count ratings per region
    existingRatings.forEach((rating) => {
      scores[rating.region] = (scores[rating.region] || 0) + 1;
    });
    return scores;
  }

  return scores;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const dateStr = searchParams.get("date");

  if (!region || !dateStr) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    // First check for existing ratings
    const existingCount = await prisma.beachGoodRating.count({
      where: {
        region: region,
        date: new Date(dateStr),
        score: {
          gte: 4,
        },
      },
    });

    if (existingCount > 0) {
      return NextResponse.json({ count: existingCount });
    }

    // If no ratings exist, get conditions and store new ratings
    const conditions = await prisma.forecastA.findFirst({
      where: {
        region: region,
        date: new Date(dateStr),
      },
    });

    if (conditions) {
      // Store new ratings
      await storeGoodBeachRatings(conditions, region, conditions.date);

      // Get fresh count
      const newCount = await prisma.beachGoodRating.count({
        where: {
          region: region,
          date: conditions.date,
          score: {
            gte: 4,
          },
        },
      });

      return NextResponse.json({ count: newCount });
    }

    return NextResponse.json({ count: 0 });
  } catch (error) {
    console.error(`Error getting beach count:`, error);
    return NextResponse.json(
      { error: "Failed to get beach count" },
      { status: 500 }
    );
  }
}
