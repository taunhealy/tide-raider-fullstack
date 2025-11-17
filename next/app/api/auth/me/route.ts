import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://tide-raider-backend.fly.dev");

/**
 * GET /api/auth/me
 * Proxy to backend /api/auth/me to get current user
 * This allows cookies to work properly (same domain)
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

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
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ user: null }, { status: 200 });
      }
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[auth/me] Error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

