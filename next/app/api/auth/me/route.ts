import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_CONFIG } from "@/app/lib/api-config";

const BACKEND_URL = API_CONFIG.baseUrl;

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

    // Check cache first
    const cacheKey = authToken || "no-token";
    const cached = authCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Build cookie header - always include all cookies
    const cookieHeader = cookieStore.toString();

    // Forward request to backend with cookies
    const backendUrl = `${BACKEND_URL}/api/auth/me`;
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieHeader || "",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 401) {
        const data = { user: null };
        authCache.set(cacheKey, { data, timestamp: Date.now() });
        return NextResponse.json(data, { status: 200 });
      }
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[auth/me] Proxy returning user: ${data.user?.id}, email: ${data.user?.email}, credits: ${data.user?.credits}`);
    authCache.set(cacheKey, { data, timestamp: Date.now() });
    return NextResponse.json(data);
  } catch (error) {
    console.error("[auth/me] GET Error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

/**
 * PUT /api/auth/me
 * Proxy to backend /api/auth/me to update current user
 */
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    
    // Invalidate cache for this user
    const cacheKey = authToken || "no-token";
    authCache.delete(cacheKey);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[auth/me] PUT Error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
