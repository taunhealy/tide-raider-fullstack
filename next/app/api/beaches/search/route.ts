import { NextResponse } from "next/server";
import { searchBeaches } from "@/app/lib/beachService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term");
  const regionId = searchParams.get("regionId");

  // Validate and sanitize input
  if (!term || term.trim().length < 2) {
    return NextResponse.json([]);
  }

  // Sanitize term to prevent injection
  const sanitizedTerm = term.trim().slice(0, 100); // Limit length

  try {
    // First search for beaches in the current region
    let regionBeaches: any[] = [];
    if (regionId) {
      try {
        regionBeaches = await searchBeaches(sanitizedTerm, {
          regionId,
          limit: 5,
        });
      } catch (regionError) {
        console.error(
          "[beaches/search] Error searching region beaches:",
          regionError
        );
        // Continue with empty array
      }
    }

    // If we don't have enough results from the current region, search all regions
    let otherBeaches: any[] = [];
    if (regionBeaches.length < 5) {
      try {
        // Search all regions, excluding the current one if we already have results
        const allBeaches = await searchBeaches(sanitizedTerm, { limit: 10 });
        otherBeaches = allBeaches
          .filter((beach) =>
            regionId && regionBeaches.length > 0
              ? beach.regionId !== regionId
              : true
          )
          .slice(0, 5 - regionBeaches.length);
      } catch (allBeachesError) {
        console.error(
          "[beaches/search] Error searching all beaches:",
          allBeachesError
        );
        // Continue with what we have
      }
    }

    // Combine results, prioritizing the current region
    const combinedResults = [...regionBeaches, ...otherBeaches];

    return NextResponse.json(combinedResults);
  } catch (error) {
    console.error("[beaches/search] Unexpected error:", error);
    // Return empty array instead of error to prevent UI breaking
    return NextResponse.json([]);
  }
}
