import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Use NEXT_PUBLIC_API_URL if set, otherwise default to production
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

/**
 * Proxy to backend /api/alerts
 * The backend handles all alert CRUD operations
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const queryString = req.nextUrl.searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/alerts${queryString ? `?${queryString}` : ""}`;

    console.log(`[alerts] Proxying GET to backend: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Forward auth token from cookie as Authorization header
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        // Also forward cookies
        Cookie: cookieStore.toString(),
      },
      credentials: "include", // Include cookies for auth
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || "Failed to fetch alerts");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[alerts] Backend error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch alerts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const body = await req.text();
    const backendUrl = `${BACKEND_URL}/api/alerts`;

    console.log(`[alerts] Proxying POST to backend: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward auth token from cookie as Authorization header
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        // Also forward cookies
        Cookie: cookieStore.toString(),
      },
      credentials: "include", // Include cookies for auth
      body,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || "Failed to create alert");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[alerts] Backend error:", error);
    return NextResponse.json(
      {
        error: "Failed to create alert",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
