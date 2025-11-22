import { NextResponse } from "next/server";
import { API_CONFIG } from "@/app/lib/api-config";

const BACKEND_URL = API_CONFIG.baseUrl;

/**
 * Proxy to backend /api/beaches/search
 * The backend handles all beach search queries
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term");
    const regionId = searchParams.get("regionId");

    console.log(
      `[beaches/search] Search request - term: "${term}", regionId: "${regionId}"`
    );

    // Validate input
    if (!term || term.trim().length < 2) {
      console.log(`[beaches/search] Term too short, returning empty array`);
      return NextResponse.json([]);
    }

    // Build backend URL with query params
    const queryParams = new URLSearchParams();
    queryParams.append("term", term);
    if (regionId) {
      queryParams.append("regionId", regionId);
    }

    const backendUrl = `${BACKEND_URL}/api/beaches/search?${queryParams.toString()}`;

    console.log(`[beaches/search] Proxying to backend: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Handle 429 gracefully - return empty array
      if (response.status === 429) {
        console.warn("[beaches/search] Rate limited, returning empty array");
        return NextResponse.json([]);
      }
      // Handle 404 - route might not be deployed yet, return empty array
      if (response.status === 404) {
        console.warn(
          "[beaches/search] Backend route not found (404), returning empty array"
        );
        return NextResponse.json([]);
      }
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      console.error(
        `[beaches/search] Backend error ${response.status}:`,
        error
      );
      // Return empty array instead of throwing to prevent UI breaking
      return NextResponse.json([]);
    }

    const data = await response.json();
    console.log(
      `[beaches/search] Returning ${Array.isArray(data) ? data.length : 0} results`
    );
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("[beaches/search] Backend error:", error);
    // Return empty array on error to prevent UI breaking
    return NextResponse.json([]);
  }
}
