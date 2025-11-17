import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Use NEXT_PUBLIC_API_URL if set, otherwise default to production
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

// Simple in-memory cache for regions (regions don't change often)
let regionsCache: { data: any[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/regions
 * Proxy to backend /api/regions with caching
 */
export async function GET(req: NextRequest) {
  try {
    // Check cache first
    if (regionsCache && Date.now() - regionsCache.timestamp < CACHE_TTL) {
      console.log("[regions] Returning cached data");
      return NextResponse.json(regionsCache.data);
    }

    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const searchParams = req.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";

    const response = await fetch(`${BACKEND_URL}/api/regions${queryString}`, {
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      // Handle 429 gracefully - return cached data if available, or empty array
      if (response.status === 429) {
        if (regionsCache) {
          return NextResponse.json(regionsCache.data);
        }
        // Return empty array instead of error to prevent UI crashes
        return NextResponse.json([]);
      }

      // Handle 404 - backend might not have regions endpoint or it's down
      if (response.status === 404) {
        console.warn(
          "[regions] Backend returned 404, returning cached data or empty array"
        );
        if (regionsCache) {
          return NextResponse.json(regionsCache.data);
        }
        return NextResponse.json([]);
      }

      // For other errors, try to return cached data first
      if (regionsCache) {
        console.warn(
          `[regions] Backend error ${response.status}, returning cached data`
        );
        return NextResponse.json(regionsCache.data);
      }

      return NextResponse.json(
        { error: "Failed to fetch regions" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Update cache
    regionsCache = {
      data: Array.isArray(data) ? data : [],
      timestamp: Date.now(),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching regions:", error);

    // Return cached data if available on error
    if (regionsCache) {
      console.log("[regions] Error occurred, returning cached data");
      return NextResponse.json(regionsCache.data);
    }

    return NextResponse.json(
      { error: "Failed to fetch regions" },
      { status: 500 }
    );
  }
}
