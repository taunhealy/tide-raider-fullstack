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
        // Forward auth info
        ...(request.headers.get("authorization") && {
          "Authorization": request.headers.get("authorization") as string,
        }),
        ...(request.headers.get("cookie") && {
          "Cookie": request.headers.get("cookie") as string,
        }),
      },
    });

    if (!response.ok) {
      // Handle 429 gracefully - return empty beaches structure
      if (response.status === 429) {
        console.warn("[filtered-beaches] Rate limited, returning empty structure");
        return NextResponse.json(
          {
            beaches: [],
            scores: {},
            forecast: null,
            totalCount: 0,
          },
          { status: 200 }
        );
      }
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
