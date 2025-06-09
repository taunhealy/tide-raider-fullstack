import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { calculateBeachScore } from "@/app/lib/scoreUtils";
import type { Beach } from "@/app/types/beaches";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const regionId = url.searchParams.get("regionId");
  const sortField = url.searchParams.get("sortField") || "score";
  const sortDirection = url.searchParams.get("sortDirection") || "desc";

  try {
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
      orderBy:
        sortField === "score"
          ? {
              // If sorting by score, we'll sort after calculating scores
              name: "asc",
            }
          : {
              [sortField]: sortDirection,
            },
    });

    // If sorting by score, we need to calculate scores and sort
    if (sortField === "score") {
      // Get forecast data for score calculation
      const forecastData = await prisma.forecastA.findFirst({
        where: {
          region: regionId || undefined,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (forecastData) {
        const beachesWithScores = beaches.map((beach) => ({
          ...beach,
          region: {
            ...beach.region,
            continent: beach.region.continent || undefined, // Convert null to undefined
          },
          score: calculateBeachScore(beach as unknown as Beach, forecastData)
            .score,
        }));

        // Sort by score
        beachesWithScores.sort((a, b) =>
          sortDirection === "desc" ? b.score - a.score : a.score - b.score
        );

        return NextResponse.json(beachesWithScores);
      }
    }

    return NextResponse.json(beaches);
  } catch (error) {
    console.error("Error fetching beaches:", error);
    return NextResponse.json(
      { error: "Failed to fetch beaches" },
      { status: 500 }
    );
  }
}
