import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/subscription/status
 * Check if the current user has an active subscription or trial
 * Used by SubscriptionProvider to gate premium features
 */
export async function GET() {
  try {
    console.log("[subscription/status] Checking subscription status...");
    
    // Get auth token from cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      console.log("[subscription/status] No auth token found");
      return NextResponse.json({
        isSubscribed: false,
        hasActiveTrial: false,
      });
    }

    // Use the backend proxy to get user data (same domain, proper cookie handling)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/backend/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
    });

    if (!response.ok) {
      console.error(
        `[subscription/status] Backend returned ${response.status}`
      );
      return NextResponse.json({
        isSubscribed: false,
        hasActiveTrial: false,
      });
    }

    const data = await response.json();
    console.log("[subscription/status] Backend response:", {
      hasUser: !!data.user,
      isSubscribed: data.user?.isSubscribed,
      hasActiveTrial: data.user?.hasActiveTrial,
    });

    return NextResponse.json({
      isSubscribed: data.user?.isSubscribed || false,
      hasActiveTrial: data.user?.hasActiveTrial || false,
    });
  } catch (error) {
    console.error("[subscription/status] Error:", error);
    return NextResponse.json({
      isSubscribed: false,
      hasActiveTrial: false,
    });
  }
}
