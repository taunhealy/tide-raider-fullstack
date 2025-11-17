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

    // Get user data from /api/auth/me
    const userResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Cookie: `auth-token=${authToken}`,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: userResponse.status }
      );
    }

    const userData = await userResponse.json();

    // Get subscription status from PayPal endpoint (more accurate)
    const subscriptionResponse = await fetch(
      `${BACKEND_URL}/api/paypal/subscription-status`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: `auth-token=${authToken}`,
        },
        credentials: "include",
        cache: "no-store",
      }
    );

    let subscriptionStatus = "INACTIVE";
    let paypalSubscriptionId = null;

    if (subscriptionResponse.ok) {
      const subData = await subscriptionResponse.json();
      subscriptionStatus = subData.subscriptionStatus || "INACTIVE";
      paypalSubscriptionId = subData.paypalSubscriptionId || null;
    } else {
      // Fallback to isSubscribed from user data
      subscriptionStatus = userData.user?.isSubscribed ? "ACTIVE" : "INACTIVE";
    }

    // Extract subscription-related fields from user object
    return NextResponse.json({
      hasActiveTrial: userData.user?.hasActiveTrial || false,
      hasTrialEnded: userData.user?.hasActiveTrial === false,
      trialEndDate: userData.user?.trialEndDate || null,
      subscriptionStatus: subscriptionStatus,
      paypalSubscriptionId: paypalSubscriptionId,
    });
  } catch (error) {
    console.error("[user/current] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
