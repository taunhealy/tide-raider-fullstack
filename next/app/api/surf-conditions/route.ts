import { NextResponse } from "next/server";

/**
 * GET /api/surf-conditions?regionId=xxx
 * This route proxies to the backend /api/filtered-beaches endpoint
 * which handles forecast fetching, score calculation, and beach filtering
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionId = searchParams.get("regionId");

  if (!regionId) {
    return NextResponse.json(
      { error: "regionId is required" },
      { status: 400 }
    );
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

  try {
    // Build backend URL with all query params
    const queryString = searchParams.toString();
    const backendApiUrl = `${backendUrl}/api/filtered-beaches${queryString ? `?${queryString}` : ""}`;

    console.log(`[surf-conditions] Proxying to backend: ${backendApiUrl}`);

    const response = await fetch(backendApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || "Failed to fetch surf conditions");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[surf-conditions] Backend error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch surf conditions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
