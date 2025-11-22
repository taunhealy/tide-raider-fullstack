import { NextResponse } from "next/server";
import { API_CONFIG } from "@/app/lib/api-config";

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

  const backendUrl = API_CONFIG.baseUrl;

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

    // Log forecast data for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("[surf-conditions] Backend response:", {
        hasForecast: !!data?.forecast,
        forecastId: data?.forecast?.id,
        forecastDate: data?.forecast?.date,
        hasScores: !!data?.scores,
        scoresCount: data?.scores ? Object.keys(data.scores).length : 0,
        queryParams: queryString,
      });
    }

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
