// next/app/api/forecasts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getLatestConditions } from "../surf-conditions/route";
import { ForecastA } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const regionId = searchParams.get("regionId");

  if (!date || !regionId) {
    return NextResponse.json(
      { error: "Date and regionId are required" },
      { status: 400 }
    );
  }

  try {
    // First get the region to ensure it exists and get its name
    const region = await prisma.region.findUnique({
      where: { id: regionId },
      select: { name: true },
    });

    if (!region) {
      return NextResponse.json(
        { error: `Region not found: ${regionId}` },
        { status: 404 }
      );
    }

    // Then get the forecast using the region name
    let forecast = await prisma.forecastA.findFirst({
      where: {
        date: new Date(date),
        regionId: regionId,
      },
    });

    if (!forecast) {
      // If no forecast exists, trigger a scrape to get and store the data
      try {
        forecast = await getLatestConditions(true, region.name) as ForecastA;
      } catch (scrapeError) {
        console.error("Failed to scrape forecast data:", scrapeError);
        return NextResponse.json(
          { error: "Failed to fetch new forecast data" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(forecast);
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return NextResponse.json(
      { error: "Failed to fetch forecast data" },
      { status: 500 }
    );
  }
}
