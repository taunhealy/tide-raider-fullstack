import { NextResponse } from "next/server";

// Use NEXT_PUBLIC_API_URL if set, otherwise use environment-appropriate default
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDevelopment = process.env.NODE_ENV === "development";
  
  // In development, use localhost backend (connects to Docker postgres)
  if (isDevelopment) {
    return envUrl || "http://localhost:4001";
  }
  
  // In production, use production backend (connects to Fly.io postgres)
  return envUrl || "https://tide-raider-backend.fly.dev";
};

const BACKEND_URL = getBackendUrl();

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

    // Add timeout to prevent hanging when backend is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    let response;
    try {
      response = await fetch(backendUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      // Handle connection errors gracefully
      const isConnectionError =
        fetchError.name === "AbortError" ||
        fetchError.code === "ECONNREFUSED" ||
        (fetchError.cause && fetchError.cause.code === "ECONNREFUSED") ||
        fetchError.message?.includes("ECONNREFUSED") ||
        fetchError.message?.includes("fetch failed");
      
      if (isConnectionError) {
        console.warn("[beach-ratings/region-counts] Backend not available, returning empty counts");
        return NextResponse.json({ counts: {} });
      }
      throw fetchError; // Re-throw other errors
    }

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
