import { NextResponse } from "next/server";
import { getServerAuth } from "@/app/lib/server-auth";

// Use NEXT_PUBLIC_API_URL if set, otherwise default to production
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

/**
 * GET /api/user/current
 * Proxy to backend to get current user's subscription details
 * This avoids needing DATABASE_URL in the Next.js app
 */
export async function GET() {
  try {
    const { user } = await getServerAuth();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get auth token from cookies
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Proxy to backend /api/auth/me which returns user data including subscription
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Cookie: `auth-token=${authToken}`,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract subscription-related fields from user object
    return NextResponse.json({
      hasActiveTrial: data.user?.hasActiveTrial || false,
      hasTrialEnded: data.user?.hasActiveTrial === false,
      trialEndDate: data.user?.trialEndDate || null,
      subscriptionStatus: data.user?.isSubscribed ? "ACTIVE" : "INACTIVE",
    });
  } catch (error) {
    console.error("[user/current] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
