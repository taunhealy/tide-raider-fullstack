import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET endpoint to retrieve scores
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!region) {
    return NextResponse.json({ error: "Region is required" }, { status: 400 });
  }

  try {
    // If date is provided, use it for both start and end
    const queryDate = date ? new Date(date) : new Date(startDate!);
    const queryEndDate = date ? new Date(date) : new Date(endDate!);

    // Get scores within the date range
    const scores = await prisma.beachDailyScore.findMany({
      where: {
        regionId: region,
        date: {
          gte: queryDate,
          lte: queryEndDate,
        },
      },
    });

    // Calculate average scores and appearances
    const beachScores = scores.reduce(
      (acc, score) => {
        if (!acc[score.beachId]) {
          acc[score.beachId] = {
            beachId: score.beachId,
            appearances: 0,
            totalScore: 0,
          };
        }
        acc[score.beachId].appearances++;
        acc[score.beachId].totalScore += score.score;
        return acc;
      },
      {} as Record<
        string,
        { beachId: string; appearances: number; totalScore: number }
      >
    );

    // Calculate averages
    const result = Object.values(beachScores).map(
      ({ beachId, appearances, totalScore }) => ({
        beachId,
        appearances,
        averageScore: totalScore / appearances,
      })
    );

    return NextResponse.json({ scores: result });
  } catch (error) {
    console.error("Error handling beach scores:", error);
    return NextResponse.json(
      { error: "Failed to handle beach scores" },
      { status: 500 }
    );
  }
}
