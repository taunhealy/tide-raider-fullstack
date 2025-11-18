import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Always use production backend if env URL is localhost (since database is live)
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  // If env URL is localhost, always use production
  if (envUrl?.includes("localhost")) {
    return "https://tide-raider-backend.fly.dev";
  }
  return envUrl || "https://tide-raider-backend.fly.dev";
};

const BACKEND_URL = getBackendUrl();

/**
 * GET /api/user-searches
 * Proxy to backend /api/user-searches
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    let response;
    try {
      response = await fetch(`${BACKEND_URL}/api/user-searches${queryString}`, {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          Cookie: cookieStore.toString(),
        },
        credentials: "include",
        signal: controller.signal,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError" || error.code === "ECONNREFUSED") {
        // Return empty array on timeout/connection error
        return NextResponse.json([]);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      // Return empty array instead of error - search tracking is not critical
      return NextResponse.json([]);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[user-searches] Error fetching searches:", error);
    // Return empty array instead of error
    return NextResponse.json([]);
  }
}

/**
 * POST /api/user-searches
 * Proxy to backend /api/user-searches
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const body = await request.json();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    let response;
    try {
      response = await fetch(`${BACKEND_URL}/api/user-searches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          Cookie: cookieStore.toString(),
        },
        credentials: "include",
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError" || error.code === "ECONNREFUSED") {
        // Silently fail - search tracking is not critical
        return NextResponse.json({ success: false }, { status: 200 });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      // Silently fail - search tracking is not critical
      return NextResponse.json({ success: false }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[user-searches] Error creating search:", error);
    // Silently fail - search tracking is not critical
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
