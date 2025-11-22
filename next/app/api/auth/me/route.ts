import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Use NEXT_PUBLIC_API_URL if set, otherwise use environment-appropriate default
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  // If NEXT_PUBLIC_API_URL is explicitly set, always use it (for both dev and prod)
  if (envUrl) {
    return envUrl;
  }

  // Fallback: use Cloud Run backend (we no longer use localhost:4001)
  return "https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app";
};

const BACKEND_URL = getBackendUrl();

// Simple in-memory cache for auth responses (5 seconds)
const authCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

/**
 * GET /api/auth/me
 * Proxy to backend /api/auth/me to get current user
 * This allows cookies to work properly (same domain)
 * Includes caching to reduce backend requests
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("[auth/me] Auth token present:", !!authToken);
      console.log("[auth/me] Backend URL:", BACKEND_URL);
      console.log("[auth/me] NODE_ENV:", process.env.NODE_ENV);
      console.log(
        "[auth/me] NEXT_PUBLIC_API_URL:",
        process.env.NEXT_PUBLIC_API_URL
      );
    }

    // Check cache first
    const cacheKey = authToken || "no-token";
    const cached = authCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Build cookie header - include auth-token if present
    const cookieHeader = authToken
      ? `auth-token=${authToken}`
      : cookieStore.toString();

    // Forward request to backend with cookies
    // Add timeout to prevent hanging when backend is not available
    // Reduced to 5 seconds for faster feedback in development
    const timeoutMs = process.env.NODE_ENV === "development" ? 5000 : 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      const backendUrl = `${BACKEND_URL}/api/auth/me`;
      if (process.env.NODE_ENV === "development") {
        console.log("[auth/me] Fetching from backend:", backendUrl);
      }
      response = await fetch(backendUrl, {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          ...(cookieHeader && { Cookie: cookieHeader }),
        },
        credentials: "include",
        // Add cache control to prevent Next.js from caching
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (process.env.NODE_ENV === "development") {
        console.log("[auth/me] Backend response status:", response.status);
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
        console.warn("[auth/me] Backend not available, returning null user", {
          error: fetchError.message,
          code: fetchError.code || fetchError.cause?.code,
        });
        const data = { user: null };
        authCache.set(cacheKey, { data, timestamp: Date.now() });
        return NextResponse.json(data, { status: 200 });
      }
      throw fetchError; // Re-throw other errors
    }

    if (!response.ok) {
      if (response.status === 401) {
        const data = { user: null };
        authCache.set(cacheKey, { data, timestamp: Date.now() });
        return NextResponse.json(data, { status: 200 });
      }
      // Handle 429 gracefully - return cached data if available
      if (response.status === 429) {
        console.warn(
          "[auth/me] Rate limited, returning cached data if available"
        );
        if (cached) {
          return NextResponse.json(cached.data);
        }
        // Return null user if no cache
        return NextResponse.json({ user: null }, { status: 200 });
      }
      // Don't cache other errors
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Cache successful responses
    authCache.set(cacheKey, { data, timestamp: Date.now() });
    return NextResponse.json(data);
  } catch (error) {
    console.error("[auth/me] Error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
