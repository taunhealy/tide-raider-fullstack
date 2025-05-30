import { NextResponse } from "next/server";
import { beachData } from "@/app/types/beaches";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term");

  if (!term || term.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // First try to search in the database
    const dbBeaches = await prisma.beach.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { location: { contains: term, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        country: true,
        region: { select: { name: true } },
      },
      take: 10,
    });

    // Format database results
    const dbResults = dbBeaches.map((beach) => ({
      id: beach.id,
      name: beach.name,
      country: beach.country,
      region: beach.region.name,
    }));

    // If we have enough results from the database, return them
    if (dbResults.length >= 5) {
      return NextResponse.json(dbResults);
    }

    // Otherwise, also search in the static data
    const termLower = term.toLowerCase();
    const staticResults = beachData
      .filter(
        (beach) =>
          beach.name.toLowerCase().includes(termLower) ||
          beach.location.toLowerCase().includes(termLower)
      )
      .map((beach) => ({
        id: beach.id,
        name: beach.name,
        country: beach.country,
        region: beach.region,
      }))
      .slice(0, 10 - dbResults.length);

    // Combine results, removing duplicates
    const allBeachIds = new Set(dbResults.map((b) => b.id));
    const combinedResults = [
      ...dbResults,
      ...staticResults.filter((b) => !allBeachIds.has(b.id)),
    ];

    return NextResponse.json(combinedResults);
  } catch (error) {
    console.error("Error searching beaches:", error);
    return NextResponse.json(
      { error: "Failed to search beaches" },
      { status: 500 }
    );
  }
}
