import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://tide-raider-backend.fly.dev");

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
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
      credentials: "include",
      // Add cache control to prevent Next.js from caching
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 401) {
        const data = { user: null };
        authCache.set(cacheKey, { data, timestamp: Date.now() });
        return NextResponse.json(data, { status: 200 });
      }
      // Don't cache errors
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
