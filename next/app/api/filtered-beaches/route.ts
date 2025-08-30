import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  Season,
  Prisma,
  OptimalTide,
  WaveType,
  CrimeLevel,
  Difficulty,
  Hazard,
} from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionId = searchParams.get("regionId")?.toLowerCase();
  const searchQuery = searchParams.get("searchQuery");

  if (!regionId) {
    return NextResponse.json(
      { error: "regionId is required" },
      { status: 400 }
    );
  }

  try {
    // Handle array parameters properly
    const crimeLevelParam = searchParams.get("crimeLevel");
    const crimeLevels = crimeLevelParam
      ? (crimeLevelParam.split(",") as CrimeLevel[])
      : undefined;

    const whereClause = {
      regionId,
      ...(searchQuery && {
        OR: [
          {
            name: { contains: searchQuery, mode: Prisma.QueryMode.insensitive },
          },
          {
            location: {
              contains: searchQuery,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }),
      ...(searchParams.get("optimalTide") && {
        optimalTide: searchParams.get("optimalTide") as OptimalTide,
      }),
      ...(searchParams.get("waveType") && {
        waveType: searchParams.get("waveType") as WaveType,
      }),
      ...(crimeLevels && {
        crimeLevel: {
          in: crimeLevels, // Use the properly split array
        },
      }),
      ...(searchParams.get("bestSeasons") && {
        bestSeasons: {
          hasSome: searchParams.get("bestSeasons")?.split(",") as Season[],
        },
      }),
      ...(searchParams.get("difficulty") && {
        difficulty: searchParams.get("difficulty") as Difficulty,
      }),
      ...(searchParams.get("hazards") && {
        hazards: {
          hasSome: searchParams.get("hazards")?.split(",") as Hazard[],
        },
      }),
    };

    // Get current date at midnight UTC
    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);

    // Fetch beaches with their daily scores
    const beaches = await prisma.beach.findMany({
      where: whereClause,
      include: {
        region: true,
        beachDailyScores: {
          where: { date: currentDate },
          select: {
            score: true,
            conditions: true,
            date: true,
          },
        },
      },
    });

    // Transform scores into a flat dictionary, ensuring the full beach object is included.
    const scores = beaches.reduce(
      (
        acc: Record<string, { score: number; beach: (typeof beaches)[number] }>,
        beach
      ) => {
        const dailyScore =
          beach.beachDailyScores.length > 0 ? beach.beachDailyScores[0] : null;
        acc[beach.id] = {
          score: dailyScore?.score ?? 0,
          beach: {
            ...beach,
            beachDailyScores: dailyScore ? [dailyScore] : [], // Ensure beachDailyScores is an array
          },
        };
        return acc;
      },
      {}
    );

    // Get regional forecast data
    const forecast = await prisma.forecastA.findFirst({
      // Renamed forecastData to forecast
      where: {
        regionId,
        date: currentDate,
      },
      select: {
        windSpeed: true,
        windDirection: true,
        swellHeight: true,
        swellPeriod: true,
        swellDirection: true,
      },
    });

    // Return transformed data structure
    return NextResponse.json({
      beaches: beaches.map((beach) => {
        // Remove the nested scores and keep other beach properties
        const { beachDailyScores, ...beachData } = beach;
        return beachData;
      }),
      scores,
      forecast, // Changed forecastData to forecast
      totalCount: beaches.length, // Added totalCount
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch filtered beaches" },
      { status: 500 }
    );
  }
}
