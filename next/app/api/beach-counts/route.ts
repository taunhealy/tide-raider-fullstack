import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { storeGoodBeachRatings } from "@/app/lib/beachRatings";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const dateStr = searchParams.get("date");

  if (!region || region.trim() === "" || !dateStr) {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }

  try {
    // First check for existing ratings
    const queryDate = new Date(dateStr);
    queryDate.setUTCHours(0, 0, 0, 0);

    const existingCount = await prisma.beachGoodRating.count({
      where: {
        region: region,
        date: queryDate,
        score: {
          gte: 4,
        },
      },
    });

    if (existingCount > 0) {
      return NextResponse.json({ count: existingCount });
    }

    // If no ratings exist, get conditions and store new ratings
    const conditions = await prisma.forecastA.findFirst({
      where: {
        region: region,
        date: {
          gte: queryDate,
          lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (conditions) {
      // Store new ratings
      await storeGoodBeachRatings(conditions, region, queryDate);

      // Get fresh count
      const newCount = await prisma.beachGoodRating.count({
        where: {
          region: region,
          date: queryDate,
          score: {
            gte: 4,
          },
        },
      });

      return NextResponse.json({ count: newCount });
    }

    console.log(`No conditions found for ${region} on ${dateStr}`);
    return NextResponse.json({ count: 0 });
  } catch (error) {
    console.error(`Error getting beach count:`, error);
    return NextResponse.json(
      { error: "Failed to get beach count" },
      { status: 500 }
    );
  }
}
