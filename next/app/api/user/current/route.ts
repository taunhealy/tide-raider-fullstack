import { NextResponse } from "next/server";
import { getServerAuth } from "@/app/lib/server-auth";

// Use NEXT_PUBLIC_API_URL if set, otherwise use environment-appropriate default
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDevelopment = process.env.NODE_ENV === "development";

  // In development, use localhost backend (connects to Docker postgres)
  if (isDevelopment) {
    if (envUrl?.includes("localhost")) {
      return envUrl.replace("localhost", "127.0.0.1");
    }
    return envUrl || "http://127.0.0.1:4005";
  }

  // In production, use production backend (Google Cloud Run)
  return envUrl || "https://tide-raider-backend-o6rx5gs5rq-ew.a.run.app";
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
    const authToken = cookieStore.get("auth-token")?.value || 
                      cookieStore.get("next-auth.session-token")?.value ||
                      cookieStore.get("__Secure-next-auth.session-token")?.value;

    if (!authToken && !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data from /api/auth/me
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    let userResponse;
    try {
      userResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
          Cookie: cookieStore.toString(),
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

    // Get subscription status from Next.js API endpoint (more reliable than backend)
    let subscriptionData = null;
    try {
      // Use the Next.js API route instead of backend
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
      const subscriptionResponse = await fetch(
        `${baseUrl}/api/paypal/subscription-status`,
        {
          headers: {
            Cookie: cookieStore.toString(),
          },
          cache: "no-store",
        }
      );

      if (subscriptionResponse.ok) {
        subscriptionData = await subscriptionResponse.json();
      }
    } catch (error) {
      console.warn("[user/current] Subscription check failed:", error);
      // Will use fallback below
    }

    // Extract subscription status - prioritize backend subscriptionStatus from /api/auth/me
    let subscriptionStatus =
      userData.user?.subscriptionStatus ||
      subscriptionData?.subscriptionStatus ||
      (userData.user?.isSubscribed ? "ACTIVE" : "INACTIVE");
    
    const paypalSubscriptionId =
      subscriptionData?.paypalSubscriptionId || null;
    
    // Check for trial status from multiple sources
    const hasActiveTrial =
      userData.user?.hasActiveTrial || 
      subscriptionData?.hasActiveTrial || 
      subscriptionStatus === "TRIAL" ||
      false;

    // If hasActiveTrial is true but status is not TRIAL or ACTIVE, set to TRIAL
    if (hasActiveTrial && subscriptionStatus !== "ACTIVE") {
      subscriptionStatus = "TRIAL";
    }

    // Extract subscription-related fields from user object
    return NextResponse.json({
      hasActiveTrial,
      hasTrialEnded: userData.user?.hasTrialEnded || false,
      trialEndDate: userData.user?.trialEndDate || null,
      subscriptionStatus,
      paypalSubscriptionId,
      referralCode: userData.user?.referralCode || null,
      credits: userData.user?.credits || 0,
    });
  } catch (error) {
    console.error("[user/current] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
