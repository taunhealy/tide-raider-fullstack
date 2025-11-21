import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

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

    // Add timeout to prevent hanging when backend is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    let response;
    try {
      const backendUrl = `${BACKEND_URL}/api/regions${queryString}`;
      if (process.env.NODE_ENV === "development") {
        console.log("[regions] Fetching from backend:", backendUrl);
        console.log("[regions] BACKEND_URL:", BACKEND_URL);
      }
      response = await fetch(backendUrl, {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          Cookie: cookieStore.toString(),
        },
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (process.env.NODE_ENV === "development") {
        console.log("[regions] Backend response status:", response.status);
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      // Handle connection errors (backend not running, network issues, etc.)
      const isConnectionError =
        fetchError.name === "AbortError" ||
        fetchError.code === "ECONNREFUSED" ||
        (fetchError.cause && fetchError.cause.code === "ECONNREFUSED") ||
        fetchError.message?.includes("ECONNREFUSED") ||
        fetchError.message?.includes("fetch failed");

      if (isConnectionError) {
        console.warn(
          "[regions] Backend not available, returning cached data or empty array"
        );
        if (regionsCache) {
          return NextResponse.json(regionsCache.data);
        }
        return NextResponse.json([]);
      }
      throw fetchError; // Re-throw other errors
    }

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
        console.error(
          `[regions] Backend returned 404 for ${BACKEND_URL}/api/regions`
        );
        console.error(
          "[regions] This usually means: 1) Backend route not registered, 2) Backend not running, or 3) Wrong BACKEND_URL"
        );
        // Try to get error details from response
        try {
          const errorData = await response.json();
          console.error("[regions] Backend error details:", errorData);
        } catch (e) {
          // Ignore JSON parse errors
        }
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
