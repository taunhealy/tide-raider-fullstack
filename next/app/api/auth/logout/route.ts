import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Use NEXT_PUBLIC_API_URL if set, otherwise default to production
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

/**
 * POST /api/auth/logout
 * Proxy to backend logout and clear frontend cookie
 */
export async function POST(req: NextRequest) {
  try {
    // Get the cookie header to forward to backend
    const cookieHeader = req.headers.get("cookie") || "";

    // Call backend logout to clear backend cookie
    // The backend will clear the cookie on its domain
    const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward cookies so backend can clear the auth-token cookie
        Cookie: cookieHeader,
      },
      credentials: "include", // Important: include cookies in the request
    });

    if (!response.ok) {
      console.warn(`[auth/logout] Backend logout returned ${response.status}`);
    }

    // Clear any frontend cookie (if it exists on the frontend domain)
    const cookieStore = await cookies();
    cookieStore.delete("auth-token");

    // Create response that also tries to clear cookie in browser
    // Note: This won't clear cookies set on other domains, but helps for same-domain cookies
    const nextResponse = NextResponse.json(
      { success: true, message: "Logged out" },
      { status: 200 }
    );

    // Try to clear cookie with same settings as backend
    // This helps if cookie was somehow set on frontend domain
    const isProduction = process.env.NODE_ENV === "production";
    nextResponse.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 0, // Expire immediately
    });

    console.log("[auth/logout] ✅ Logout successful");
    return nextResponse;
  } catch (error) {
    console.error("[auth/logout] Error:", error);
    // Even on error, try to clear cookie and return success
    const nextResponse = NextResponse.json(
      { success: true, message: "Logged out" },
      { status: 200 }
    );

    const cookieStore = await cookies();
    cookieStore.delete("auth-token");

    const isProduction = process.env.NODE_ENV === "production";
    nextResponse.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 0,
    });

    return nextResponse;
  }
}
