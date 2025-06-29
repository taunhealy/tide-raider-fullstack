import { NextResponse } from "next/server";
import { beachData } from "@/app/types/beaches";
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
      regionBeaches = await prisma.beach.findMany({
        where: {
          regionId: regionId,
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { location: { contains: term, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          country: true,
          regionId: true,
          region: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 5,
      });
    }

    // If we don't have enough results from the current region, search all regions
    let otherBeaches: any[] = [];
    if (regionBeaches.length < 5) {
      const whereClause: any = {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { location: { contains: term, mode: "insensitive" } },
        ],
      };

      // Exclude the current region if we already have results from it
      if (regionId && regionBeaches.length > 0) {
        whereClause.NOT = { regionId };
      }

      otherBeaches = await prisma.beach.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          country: true,
          regionId: true,
          region: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 5 - regionBeaches.length,
      });
    }

    // Combine results, prioritizing the current region
    const combinedResults = [...regionBeaches, ...otherBeaches];

    return NextResponse.json(combinedResults);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to search beaches" },
      { status: 500 }
    );
  }
}
