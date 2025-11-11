import { NextResponse } from "next/server";
import { searchBeaches } from "@/app/lib/beachService";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term");
  const regionId = searchParams.get("regionId");

  if (!term || term.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // First search for beaches in the current region
    let regionBeaches: any[] = [];
    if (regionId) {
      regionBeaches = await searchBeaches(term, { regionId, limit: 5 });
    }

    // If we don't have enough results from the current region, search all regions
    let otherBeaches: any[] = [];
    if (regionBeaches.length < 5) {
      // Search all regions, excluding the current one if we already have results
      const allBeaches = await searchBeaches(term, { limit: 10 });
      otherBeaches = allBeaches
        .filter((beach) =>
          regionId && regionBeaches.length > 0
            ? beach.regionId !== regionId
            : true
        )
        .slice(0, 5 - regionBeaches.length);
    }

    // Combine results, prioritizing the current region
    const combinedResults = [...regionBeaches, ...otherBeaches];

    return NextResponse.json(combinedResults);
  } catch (error) {
    console.error("Beach search error:", error);
    return NextResponse.json(
      { error: "Failed to search beaches" },
      { status: 500 }
    );
  }
}
