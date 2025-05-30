import { prisma } from "@/app/lib/prisma";
import { beachData } from "@/app/types/beaches";
import { isBeachSuitable } from "./surfUtils";
import { randomUUID } from "crypto";
import type { WindData, WindDataProp } from "@/app/types/wind";
import { NextResponse } from "next/server";

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

    const regionBeaches = beachData.filter((b) => b.region === region);
    console.log(`📍 Found ${regionBeaches.length} beaches in ${region}`);

    if (regionBeaches.length === 0) {
      console.error(`❌ No beaches found for region: ${region}`);
      return 0;
    }

    // Convert forecast to expected WindDataProp format
    const conditions: WindDataProp = {
      date,
      region,
      windSpeed: forecast.windSpeed,
      windDirection: Number(forecast.windDirection),
      swellHeight: forecast.swellHeight,
      swellDirection: Number(forecast.swellDirection),
      swellPeriod: forecast.swellPeriod,
    };

    console.log("Processed conditions:", conditions);

    const ratingsToStore = regionBeaches
      .map((beach) => {
        const { score, suitable } = isBeachSuitable(beach, conditions);
        console.log(
          `Beach ${beach.name}: score=${score}, suitable=${suitable}`
        );
        return { beach, score, suitable };
      })
      .filter(({ score }) => score >= 4);

    console.log(`🌊 Found ${ratingsToStore.length} beaches with score >= 4`);
    console.log("Ratings to store:", ratingsToStore);

    if (ratingsToStore.length === 0) {
      console.log(`📊 No suitable beaches found in ${region}`);
      return 0;
    }

    const result = await prisma.beachGoodRating.createMany({
      data: ratingsToStore.map(({ beach, score }) => ({
        id: randomUUID(),
        date,
        beachId: beach.id,
        region: beach.region,
        score,
        conditions: conditions,
      })),
      skipDuplicates: true,
    });

    console.log(`✅ Stored ${result.count} ratings for ${region}`);
    return result.count;
  } catch (error) {
    console.error("💥 Critical rating storage error:", error);
    throw error;
  }
}

// Use existing ratings from database when possible
export async function getGoodBeachCount(
  region: string,
  date: Date,
  conditions?: WindData
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

  // Fall back to calculation if conditions provided
  if (conditions) {
    return beachData.filter(
      (beach) =>
        beach.region === region && isBeachSuitable(beach, conditions).suitable
    ).length;
  }

  return 0;
}

// Optimized to use existing ratings and reduce calculations
export async function getRegionScores(
  date: Date,
  region: string,
  conditions?: WindData
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

  // Fall back to calculation if conditions provided
  if (conditions) {
    const suitableBeaches = beachData
      .filter((beach) => beach.region === region)
      .filter((beach) => isBeachSuitable(beach, conditions).suitable);

    suitableBeaches.forEach((beach) => {
      scores[beach.region] = (scores[beach.region] || 0) + 1;
    });
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
