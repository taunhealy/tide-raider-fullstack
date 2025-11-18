// next/app/api/forecasts/route.ts
import { NextResponse } from "next/server";
import { backendGet } from "@/app/lib/backend-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const regionId = searchParams.get("regionId");

    if (!date || !regionId) {
      return NextResponse.json(
        { error: "Date and regionId are required" },
        { status: 400 }
      );
    }

    // Use backend forecast endpoint
    const forecast = await backendGet(
      `/api/forecast?regionId=${regionId}&forecastDate=${date}`
    );

    return NextResponse.json(forecast);
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return NextResponse.json(
      { error: "Failed to fetch forecast data" },
      { status: 500 }
    );
  }
}
