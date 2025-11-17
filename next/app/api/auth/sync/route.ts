import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://tide-raider-backend.fly.dev");

/**
 * POST /api/auth/sync
 * Syncs backend auth-token cookie with NextAuth session
 * Called after OAuth redirect to create NextAuth session from backend cookie
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: "No auth token found" },
        { status: 401 }
      );
    }

    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Auth secret not configured" },
        { status: 500 }
      );
    }

    // Verify and decode the token
    let decoded: any;
    try {
      decoded = jwt.verify(authToken, secret);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid auth token" },
        { status: 401 }
      );
    }

    // Fetch user info from backend
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user info" },
        { status: response.status }
      );
    }

    const userData = await response.json();
    const user = userData.user;

    // Return user data - NextAuth will handle session creation via signIn
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        isSubscribed: user.isSubscribed,
        hasActiveTrial: user.hasActiveTrial,
      },
      // Include token info for client-side use if needed
      token: {
        id: decoded.id || decoded.sub,
        email: decoded.email,
      },
    });
  } catch (error) {
    console.error("[auth/sync] Error:", error);
    return NextResponse.json(
      { error: "Failed to sync session" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/sync
 * Check if user is authenticated (has auth-token cookie)
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.json({ authenticated: false });
    }

    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ authenticated: false });
    }

    try {
      const decoded = jwt.verify(authToken, secret) as any;
      return NextResponse.json({
        authenticated: true,
        userId: decoded.id || decoded.sub,
        email: decoded.email,
      });
    } catch (error) {
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}

