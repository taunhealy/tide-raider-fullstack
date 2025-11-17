import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/beach-ratings/historical
 * Proxy to backend API
 * Note: This endpoint should be implemented in the backend
 */
export async function GET(request: NextRequest) {
  try {
    // For now, return empty data until backend endpoint is implemented
    // TODO: Implement /api/beach-ratings/historical in backend
    return NextResponse.json({
      beaches: [],
      period: request.nextUrl.searchParams.get("period") || "today",
      dateRange: {
        start: new Date(),
        end: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch historical beach ratings:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical beach ratings" },
      { status: 500 }
    );
  }
}
