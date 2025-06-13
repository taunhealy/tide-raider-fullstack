import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { storeBeachDailyScores } from "@/app/lib/beachDailyScores";

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

    // If we have forecast data, get or calculate scores
    if (forecastData) {
      // Store scores using the dedicated service
      await storeBeachDailyScores(
        forecastData,
        regionId || "Global",
        new Date()
      );

      // Get the stored scores
      const beachScores = await prisma.beachDailyScore.findMany({
        where: {
          region: regionId || "Global",
          date: new Date(),
        },
      });

      // Map scores to beaches
      const beachesWithScores = beaches
        .map((beach) => {
          const score =
            beachScores.find((s) => s.beachId === beach.id)?.score || 0;
          return {
            ...beach,
            region: {
              ...beach.region,
              continent: beach.region?.continent || undefined,
            },
            score,
          };
        })
        .filter((beach) => beach.score >= minScore)
        .sort((a, b) => {
          if (sortField === "score") {
            return sortDirection === "desc"
              ? b.score - a.score
              : a.score - b.score;
          }
          return 0;
        });

      return NextResponse.json(beachesWithScores);
    }

    // If no forecast data available, return beaches without scores
    return NextResponse.json(beaches);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch beaches" },
      { status: 500 }
    );
  }
}
