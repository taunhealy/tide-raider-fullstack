import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

import { storeGoodBeachRatings } from "@/app/lib/goodBeachRatings";
import type { WindDataProp } from "@/app/types/wind";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const dateStr = searchParams.get("date");
  const conditions = (await request.json()) as WindDataProp;

  if (!region || !dateStr || !conditions) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const count = await storeGoodBeachRatings(
      conditions,
      region,
      new Date(dateStr)
    );

    return NextResponse.json({ count });
  } catch (error) {
    console.error(`Error storing beach ratings:`, error);
    return NextResponse.json(
      { error: "Failed to store beach ratings" },
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
