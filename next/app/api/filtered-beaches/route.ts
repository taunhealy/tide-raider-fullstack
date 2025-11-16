import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Proxy to backend /api/filtered-beaches
 * The backend handles all score calculations and database queries
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get("regionId");

    if (!regionId) {
      return NextResponse.json(
        { error: "regionId is required" },
        { status: 400 }
      );
    }

    // Build backend URL with all query params
    const queryString = searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/filtered-beaches${queryString ? `?${queryString}` : ""}`;

    console.log(`[filtered-beaches] Proxying to backend: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || "Failed to fetch filtered beaches");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[filtered-beaches] Backend error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch filtered beaches",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
