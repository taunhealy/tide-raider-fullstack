import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Proxy to backend /api/beach-ratings/region-counts
 * The backend handles all score calculations and database queries
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    // Build backend URL with query params
    const backendUrl = `${BACKEND_URL}/api/beach-ratings/region-counts${
      dateParam ? `?date=${dateParam}` : ""
    }`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Handle 429 gracefully - return empty counts
      if (response.status === 429) {
        console.warn(
          "[beach-ratings/region-counts] Rate limited, returning empty counts"
        );
        return NextResponse.json({ counts: {} });
      }
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || "Failed to fetch region counts");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Database not accessible or other errors - return empty counts
    console.error("[beach-ratings/region-counts] Backend error:", error);
    return NextResponse.json({ counts: {} });
  }
}
