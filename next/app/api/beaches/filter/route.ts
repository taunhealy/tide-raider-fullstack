import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { FILTERS } from "@/app/config/filters";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 30;
  const skip = (page - 1) * limit;

  try {
    const where: any = {};
    const regionId = searchParams.get("regionId");
    if (!regionId) {
      return NextResponse.json({
        beaches: [],
        scores: {},
        pagination: { hasMore: false, page },
      });
    }

    where.regionId = regionId;

    // Get today's date for scores
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Build the base query including scores
    const baseQuery = {
      where,
      include: {
        region: true,
        country: true,
        beachDailyScores: {
          where: { date: today },
          take: 1,
        },
      },
    };

    // Apply search filter if present
    const searchQuery = searchParams.get("searchQuery");
    if (searchQuery && searchQuery.length > 1) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { location: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // Apply standard filters
    for (const filter of FILTERS) {
      const value = searchParams.get(filter.urlParam);
      if (!value) continue;

      if (filter.type === "array") {
        const values = value.split(",");
        if (filter.key === "difficulty" && values.includes("All Levels")) {
          continue;
        }
        where[filter.beachProp] = { in: values };
      } else if (filter.type === "boolean") {
        where[filter.beachProp] = value === "true";
      }
    }

    // Apply minPoints filter at the database level
    const minPointsValue = searchParams.get("minPoints");
    if (minPointsValue) {
      const minPoints = parseFloat(minPointsValue);
      where.beachDailyScores = {
        some: {
          date: today,
          score: { gte: minPoints },
        },
      };
    }

    // Count total filtered beaches
    const totalCount = await prisma.beach.count({ where });

    // Get beaches with scores, sorted by score
    const beaches = await prisma.beach.findMany({
      ...baseQuery,
      orderBy: [
        {
          name: "asc", // Default sort by name if no scores
        },
      ],
      skip,
      take: limit,
    });

    // Sort beaches by score in memory if scores exist
    const sortedBeaches = beaches.sort((a, b) => {
      const scoreA = a.beachDailyScores?.[0]?.score ?? -1;
      const scoreB = b.beachDailyScores?.[0]?.score ?? -1;
      return scoreB - scoreA; // Descending order
    });

    // Transform the response
    const scoreMap = sortedBeaches.reduce(
      (acc, beach) => {
        if (beach.beachDailyScores?.[0]) {
          acc[beach.id] = {
            score: beach.beachDailyScores[0].score,
            beach: {
              ...beach,
              beachDailyScores: beach.beachDailyScores,
            },
          };
        }
        return acc;
      },
      {} as Record<string, any>
    );

    return NextResponse.json({
      beaches: sortedBeaches.map((beach) => ({
        ...beach,
        beachDailyScores: undefined, // Remove scores from beach object
      })),
      scores: scoreMap,
      pagination: {
        hasMore: skip + sortedBeaches.length < totalCount,
        page,
      },
    });
  } catch (error) {
    console.error("Failed to filter beaches:", error);
    return NextResponse.json(
      { error: "Failed to filter beaches" },
      { status: 500 }
    );
  }
}
