import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { subDays, subYears, startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const period = searchParams.get("period"); // "today" | "week" | "year" | "3years"

  if (!region || !period) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const now = new Date();
    let startDate;
    let endDate;

    if (period === "today") {
      startDate = startOfDay(now);
      endDate = endOfDay(now);
    } else {
      startDate =
        period === "week"
          ? subDays(now, 7)
          : period === "year"
            ? subYears(now, 1)
            : subYears(now, 3);
      endDate = now;
    }

    // Get high scoring beaches for the period
    const highScores = await prisma.beachGoodRating.groupBy({
      by: ["beachId"],
      where: {
        region,
        date: {
          gte: startDate,
          ...(period === "today" && { lte: endDate }),
        },
        score: { gte: 4 },
      },
      _count: { beachId: true },
      _avg: { score: true },
    });

    // Sort by count and average score
    const sortedScores = highScores
      .sort(
        (a, b) =>
          b._count.beachId - a._count.beachId ||
          (b._avg.score || 0) - (a._avg.score || 0)
      )
      .slice(0, 5)
      .map((score) => ({
        beachId: score.beachId,
        appearances: score._count.beachId,
        averageScore: score._avg.score,
      }));

    return NextResponse.json({ scores: sortedScores });
  } catch (error) {
    console.error("Error fetching high scores:", error);
    return NextResponse.json(
      { error: "Failed to fetch high scores" },
      { status: 500 }
    );
  }
}
