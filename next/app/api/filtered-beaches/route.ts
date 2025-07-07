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
    const whereClause = {
      regionId,
      // Search query filter
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
      // Sidebar filters
      ...(searchParams.get("optimalTide") && {
        optimalTide: searchParams.get("optimalTide") as OptimalTide,
      }),
      ...(searchParams.get("waveType") && {
        waveType: searchParams.get("waveType") as WaveType,
      }),
      ...(searchParams.get("crimeLevel") && {
        crimeLevel: searchParams.get("crimeLevel") as CrimeLevel,
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

    const beaches = await prisma.beach.findMany({
      where: whereClause,
      include: {
        region: true,
        beachDailyScores: {
          where: { date: new Date() },
          select: { score: true, conditions: true },
        },
      },
    });

    return NextResponse.json({ beaches });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch filtered beaches" },
      { status: 500 }
    );
  }
}
