import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/app/lib/server-auth";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tide-raider-backend-o6rx5gs5rq-ew.a.run.app";

/**
 * GET /api/paypal/subscription-status
 * Get the current user's subscription status by proxying to backend
 * Returns: subscriptionStatus, hasActiveTrial, paypalSubscriptionId, isPremium
 */
export async function GET(req: NextRequest) {
  try {
    // -------------------------------------------------
    // 1️⃣ Authenticate the user
    // -------------------------------------------------
    const { user } = await getServerAuth();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -------------------------------------------------
    // 2️⃣ Fetch user data from backend /api/auth/me
    // -------------------------------------------------
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.get("cookie") || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 401) {
        return NextResponse.json(
          { error: "User not found or unauthorized" },
          { status: response.status }
        );
      }
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    const userData = data.user;

    // -------------------------------------------------
    // 3️⃣ Determine if user has premium access
    // Backend already provides isSubscribed
    // -------------------------------------------------
    const hasActiveTrial = userData.hasActiveTrial || false;
    const isSubscribed = userData.isSubscribed || false;
    const isPremium = isSubscribed || hasActiveTrial;

    // -------------------------------------------------
    // 4️⃣ Return subscription status
    // -------------------------------------------------
    return NextResponse.json({
      subscriptionStatus: isSubscribed ? "ACTIVE" : null,
      hasActiveTrial,
      paypalSubscriptionId: null, // Not returned by /api/auth/me
      isPremium,
      credits: userData.credits || 0,
      referralCode: userData.referralCode || null,
      // Additional info that might be useful
      trialEndDate: userData.trialEndDate,
      hasTrialEnded: false, // Not returned by /api/auth/me
    });
  } catch (error) {
    console.error("[paypal/subscription-status] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch subscription status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
