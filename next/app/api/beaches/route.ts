// app/api/beaches/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionId = searchParams.get("regionId");
  const sortField = searchParams.get("sortField") || "score";
  const sortDirection = searchParams.get("sortDirection") || "desc";

  if (!regionId) {
    return NextResponse.json(
      { error: "Region ID is required" },
      { status: 400 }
    );
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const beaches = await prisma.beach.findMany({
      where: {
        regionId,
      },
      include: {
        beachDailyScores: {
          where: {
            date: today,
          },
          take: 1,
        },
      },
    });

    const beachesWithScores = beaches.map((beach) => ({
      ...beach,
      score: beach.beachDailyScores[0]?.score || 0,
    }));

    if (sortField === "score") {
      beachesWithScores.sort((a, b) =>
        sortDirection === "desc" ? b.score - a.score : a.score - b.score
      );
    }

    return NextResponse.json(beachesWithScores);
  } catch (error) {
    console.error("Error fetching beaches:", error);
    return NextResponse.json(
      { error: "Failed to fetch beaches" },
      { status: 500 }
    );
  }
}
