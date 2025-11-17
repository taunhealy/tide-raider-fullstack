import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://tide-raider-backend.fly.dev");

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

    const response = await fetch(
      `${BACKEND_URL}/api/user-searches${queryString}`,
      {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          Cookie: cookieStore.toString(),
        },
        credentials: "include",
      }
    );

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

    const response = await fetch(`${BACKEND_URL}/api/user-searches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

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
