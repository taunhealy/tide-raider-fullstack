import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getLatestConditions } from "../surf-conditions/route";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionId = searchParams.get("regionId");

  if (!regionId) {
    return NextResponse.json(
      { error: "Region ID is required" },
      { status: 400 }
    );
  }

  try {
    // Use the existing getLatestConditions function that handles scraping and caching
    const forecast = await getLatestConditions(false, regionId);

    if (!forecast) {
      return NextResponse.json(
        { error: "No forecast data found" },
        { status: 404 }
      );
    }

    return NextResponse.json(forecast);
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return NextResponse.json(
      { error: "Failed to fetch forecast data" },
      { status: 500 }
    );
  }
}
