import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/set-token
 * Sets the auth-token cookie on the frontend domain
 * Called after OAuth redirect when token is in URL
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      console.error("[auth/set-token] No token provided");
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    console.log("[auth/set-token] Setting auth-token cookie");

    // Set cookie on frontend domain (same domain = can use lax)
    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.json({ success: true });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax", // Same domain, so lax is fine
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    console.log("[auth/set-token] Cookie set successfully");

    return response;
  } catch (error) {
    console.error("[auth/set-token] Error:", error);
    return NextResponse.json({ error: "Failed to set token" }, { status: 500 });
  }
}
