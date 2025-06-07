import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { filterGoodBeaches } from "@/app/lib/beachSortUtils";

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

    // Check if we already have ratings for these regions today
    const existingRegions = await prisma.beachGoodRating.findMany({
      where: {
        date: today,
        region: { in: regions },
      },
      select: { region: true },
      distinct: ["region"],
    });

    // If any of these regions already have ratings for today, skip them
    if (existingRegions.length > 0) {
      console.log(
        `✅ Ratings already exist for regions: ${existingRegions.map((r) => r.region).join(", ")} on ${today.toISOString()}`
      );
      return NextResponse.json({
        success: true,
        message: `Ratings already exist for regions: ${existingRegions.map((r) => r.region).join(", ")}`,
      });
    }

    // Save the pre-filtered good beaches directly
    await prisma.beachGoodRating.createMany({
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
    console.error("Error saving good beach ratings:", error);
    return NextResponse.json(
      { error: "Failed to save ratings" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve ratings
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const dateStr = searchParams.get("date");

  if (!region || !dateStr) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const ratings = await prisma.beachGoodRating.findMany({
      where: {
        region: region,
        date: new Date(dateStr),
      },
    });

    return NextResponse.json({ ratings });
  } catch (error) {
    console.error(`Error fetching beach ratings:`, error);
    return NextResponse.json(
      { error: "Failed to fetch beach ratings" },
      { status: 500 }
    );
  }
}
