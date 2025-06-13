import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { storeBeachDailyScores } from "@/app/lib/beachDailyScores";

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
        region,
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

// POST endpoint to store scores directly
export async function POST(request: Request) {
  try {
    const { beachScores } = await request.json();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Get unique regions from the incoming scores
    const regions = [
      ...new Set(
        Object.values(beachScores).map((data) => (data as any).region)
      ),
    ];

    // Check if we already have scores for these regions today
    const existingRegions = await prisma.beachDailyScore.findMany({
      where: {
        date: today,
        region: { in: regions },
      },
      select: { region: true },
      distinct: ["region"],
    });

    // If any of these regions already have scores for today, skip them
    if (existingRegions.length > 0) {
      console.log(
        `✅ Scores already exist for regions: ${existingRegions.map((r) => r.region).join(", ")} on ${today.toISOString()}`
      );
      return NextResponse.json({
        success: true,
        message: `Scores already exist for regions: ${existingRegions.map((r) => r.region).join(", ")}`,
      });
    }

    // Save the scores directly
    await prisma.beachDailyScore.createMany({
      data: Object.entries(beachScores).map(([beachId, beachData]) => ({
        beachId,
        score: (beachData as any).score,
        region: (beachData as any).region,
        conditions: (beachData as any).conditions || "",
        date: today,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving beach scores:", error);
    return NextResponse.json(
      { error: "Failed to save scores" },
      { status: 500 }
    );
  }
}
