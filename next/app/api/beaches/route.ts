import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { calculateBeachScore } from "@/app/lib/scoreUtils";
import type { Beach } from "@/app/types/beaches";
import type { CoreForecastData } from "@/app/types/forecast";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const regionId = url.searchParams.get("regionId");
  const sortField = url.searchParams.get("sortField") || "score";
  const sortDirection = url.searchParams.get("sortDirection") || "desc";
  const minScore = Number(url.searchParams.get("minScore")) || 0;

  try {
    // Get the latest forecast data first
    const forecastData = await prisma.forecastA.findFirst({
      where: {
        region: regionId || undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch beaches with all necessary data
    const beaches = await prisma.beach.findMany({
      where: regionId
        ? {
            OR: [{ regionId }, { region: { name: regionId } }],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        continent: true,
        countryId: true,
        regionId: true,
        image: true,
        optimalWindDirections: true,
        optimalSwellDirections: true,
        swellSize: true,
        idealSwellPeriod: true,
        videos: true,
        region: {
          include: {
            country: true,
          },
        },
        difficulty: true,
        waveType: true,
        location: true,
        distanceFromCT: true,
        bestSeasons: true,
        optimalTide: true,
        description: true,
        waterTemp: true,
        hazards: true,
        crimeLevel: true,
        sharkAttack: true,
        coordinates: true,
        sheltered: true,
      },
    });

    // Calculate scores and filter/sort beaches
    if (forecastData) {
      const conditions: CoreForecastData = {
        windSpeed: forecastData.windSpeed,
        windDirection: forecastData.windDirection,
        swellHeight: forecastData.swellHeight,
        swellDirection: forecastData.swellDirection,
        swellPeriod: forecastData.swellPeriod,
      };

      const beachesWithScores = beaches
        .map((beach) => {
          const { score } = calculateBeachScore(
            beach as unknown as Beach,
            conditions
          );
          return {
            ...beach,
            region: {
              ...beach.region,
              continent: beach.region?.continent || undefined,
            },
            score,
          };
        })
        .filter((beach) => beach.score >= minScore) // Filter by minimum score
        .sort((a, b) => {
          if (sortField === "score") {
            return sortDirection === "desc"
              ? b.score - a.score
              : a.score - b.score;
          }
          // Handle other sort fields if needed
          return 0;
        });

      return NextResponse.json(beachesWithScores);
    }

    // If no forecast data available, return beaches without scores
    return NextResponse.json(beaches);
  } catch (error) {
    console.error("Error fetching beaches:", error);
    return NextResponse.json(
      { error: "Failed to fetch beaches" },
      { status: 500 }
    );
  }
}
