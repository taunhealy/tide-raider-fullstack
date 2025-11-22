import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/app/lib/api-config";

/**
 * POST /api/paypal/sync
 * Proxy to backend to sync subscription status from PayPal
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/paypal/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        Cookie: `auth-token=${authToken}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));

      // If backend returns 500 with PayPal configuration error, check if it's a trial user
      // and return a more informative message
      if (
        response.status === 500 &&
        error.error?.includes("PayPal configuration missing")
      ) {
        // Try to get user info to check if they're on a trial
        try {
          const userResponse = await fetch(
            `${backendUrl}/api/paypal/subscription-status`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
                Cookie: `auth-token=${authToken}`,
              },
              credentials: "include",
            }
          );

          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (
              userData.hasActiveTrial ||
              userData.subscriptionStatus === "TRIAL"
            ) {
              return NextResponse.json({
                message:
                  "You are on a free trial. No PayPal subscription to sync.",
                subscriptionStatus: userData.subscriptionStatus,
                hasActiveTrial: userData.hasActiveTrial,
                synced: false,
              });
            }
          }
        } catch (e) {
          // If we can't check user status, just return the original error
        }
      }

      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[paypal/sync] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to sync subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
