import { NextResponse } from "next/server";
import { getServerAuth } from "@/app/lib/server-auth";

// Use NEXT_PUBLIC_API_URL if set, otherwise use environment-appropriate default
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDevelopment = process.env.NODE_ENV === "development";

  // In development, use localhost backend (connects to Docker postgres)
  if (isDevelopment) {
    return envUrl || "http://localhost:4001";
  }

  // In production, use production backend (connects to Fly.io postgres)
  return envUrl || "https://tide-raider-backend.fly.dev";
};

const BACKEND_URL = getBackendUrl();

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    let userResponse;
    try {
      userResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: `auth-token=${authToken}`,
        },
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      // Handle connection errors gracefully
      if (error.name === "AbortError" || error.code === "ECONNREFUSED") {
        console.error(
          "[user/current] Backend connection failed:",
          error.message
        );
        return NextResponse.json(
          { error: "Backend unavailable" },
          { status: 503 }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: userResponse.status }
      );
    }

    const userData = await userResponse.json();

    // Get subscription status from PayPal endpoint (more accurate)
    const subController = new AbortController();
    const subTimeoutId = setTimeout(() => subController.abort(), 5000); // 5 second timeout

    let subscriptionResponse;
    try {
      subscriptionResponse = await fetch(
        `${BACKEND_URL}/api/paypal/subscription-status`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Cookie: `auth-token=${authToken}`,
          },
          credentials: "include",
          cache: "no-store",
          signal: subController.signal,
        }
      );
    } catch (error: any) {
      clearTimeout(subTimeoutId);
      // Handle connection errors gracefully - fallback to user data
      if (error.name === "AbortError" || error.code === "ECONNREFUSED") {
        console.warn(
          "[user/current] Subscription check failed, using fallback"
        );
        subscriptionResponse = null; // Will use fallback below
      } else {
        throw error;
      }
    } finally {
      clearTimeout(subTimeoutId);
    }

    let subscriptionStatus = "INACTIVE";
    let paypalSubscriptionId = null;

    if (subscriptionResponse && subscriptionResponse.ok) {
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
