import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Get counts of beaches with score >= 4 grouped by region for today
    const regionCounts = await prisma.beachGoodRating.groupBy({
      by: ["region"],
      where: {
        date: {
          equals: new Date(date),
        },
        score: {
          gte: 4,
        },
      },
      _count: {
        beachId: true,
      },
    });

    // Transform the data into a more usable format
    const counts = regionCounts.reduce(
      (acc, curr) => {
        acc[curr.region] = curr._count.beachId;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({ counts });
  } catch (error) {
    console.error("Error fetching region counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch region counts" },
      { status: 500 }
    );
  }
}
