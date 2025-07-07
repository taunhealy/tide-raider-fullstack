import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { subDays, subMonths, subYears, startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionId = searchParams.get("regionId");
  const period = searchParams.get("period") || "today";

  if (!regionId) {
    return NextResponse.json(
      { error: "regionId is required" },
      { status: 400 }
    );
  }

  // Calculate date range based on period
  const now = new Date();
  let startDate: Date;
  const endDate = endOfDay(now);

  switch (period) {
    case "week":
      startDate = subDays(startOfDay(now), 7);
      break;
    case "month":
      startDate = subMonths(startOfDay(now), 1);
      break;
    case "year":
      startDate = subYears(startOfDay(now), 1);
      break;
    case "today":
    default:
      startDate = startOfDay(now);
      break;
  }

  try {
    // Get beaches for the region
    const beaches = await prisma.beach.findMany({
      where: { regionId },
      include: {
        region: true,
        beachDailyScores: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    // Calculate total scores for the period (not average)
    const beachesWithScores = beaches.map((beach) => {
      const scores = beach.beachDailyScores;
      const totalScore = scores.reduce(
        (sum, score) => sum + (score.score || 0),
        0
      );
      const appearances = scores.length;

      return {
        id: beach.id,
        name: beach.name,
        region: beach.region,
        totalScore: totalScore,
        appearances,
        latestScore: scores[0]?.score || 0,
      };
    });

    // Sort by total score for all periods
    const sortedBeaches = beachesWithScores.sort((a, b) =>
      period === "today"
        ? b.latestScore - a.latestScore
        : b.totalScore - a.totalScore
    );

    return NextResponse.json({
      beaches: sortedBeaches,
      period,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    });
  } catch (error) {
    console.error("Failed to fetch historical beach ratings:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical beach ratings" },
      { status: 500 }
    );
  }
}
