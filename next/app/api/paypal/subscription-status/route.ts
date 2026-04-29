import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/app/lib/server-auth";

import { API_CONFIG } from "@/app/lib/api-config";

const BACKEND_URL = API_CONFIG.baseUrl;

/**
 * GET /api/paypal/subscription-status
 * Get the current user's subscription status by proxying to backend
 * Returns: subscriptionStatus, hasActiveTrial, paypalSubscriptionId, isPremium
 */
export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Fetch user data from backend /api/auth/me using cookies from the request
    // This serves as both authentication AND data retrieval
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.get("cookie") || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    const userData = data.user;

    if (!userData) {
      return NextResponse.json({ error: "User data missing" }, { status: 404 });
    }

    // -------------------------------------------------
    // 3️⃣ Determine if user has premium access
    // Backend already provides isSubscribed
    // -------------------------------------------------
    const hasActiveTrial = userData.hasActiveTrial || false;
    const isSubscribed = userData.isSubscribed || false;
    const isPremium = isSubscribed || hasActiveTrial;

    console.log(`[paypal/subscription-status] Returning credits: ${userData.credits || 0} for user: ${userData.id}`);
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
