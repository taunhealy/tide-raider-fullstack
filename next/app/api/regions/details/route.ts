import { NextRequest, NextResponse } from "next/server";
import { backendGet } from "@/app/lib/backend-api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const regionName = searchParams.get("region");

    if (!regionName) {
      return NextResponse.json(
        { error: "Region parameter is required" },
        { status: 400 }
      );
    }

    const region = await backendGet(`/api/regions?name=${encodeURIComponent(regionName)}`);
    return NextResponse.json(region);
  } catch (error) {
    console.error("Error fetching region details:", error);
    return NextResponse.json(
      { error: "Failed to fetch region details" },
      { status: 500 }
    );
  }
}
