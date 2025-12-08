import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/app/lib/server-auth";
import { prisma } from "@/app/lib/prisma";

/**
 * POST /api/paypal/sync
 * Sync the user's subscription status from PayPal API to the database
 * This fetches the latest status from PayPal and updates the user record
 */
// Switching to nodejs for better compatibility
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // -------------------------------------------------
    // 1️⃣ Authenticate the user
    // -------------------------------------------------
    const { user } = await getServerAuth();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if request has body with subscriptionId (from checkout success page)
    let subscriptionIdToLink: string | undefined;
    try {
      const body = await req.json();
      subscriptionIdToLink = body.subscriptionId;
    } catch (e) {
      // Body might be empty if called without data
    }

    // If we have a new subscription ID, update the user first
    if (subscriptionIdToLink) {
      console.log(`[paypal/sync] Linking new subscription ID ${subscriptionIdToLink} to user ${user.id}`);
      await prisma.user.update({
        where: { id: user.id },
        data: { paypalSubscriptionId: subscriptionIdToLink },
      });
    }

    // -------------------------------------------------
    // 2️⃣ Get user's PayPal subscription ID from database
    // -------------------------------------------------
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        paypalSubscriptionId: true,
        hasActiveTrial: true,
        subscriptionStatus: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is on trial or has no active subscription (no PayPal subscription to sync)
    if (
      userData.hasActiveTrial ||
      userData.subscriptionStatus === "TRIAL" ||
      userData.subscriptionStatus === "INACTIVE" ||
      userData.subscriptionStatus === "CANCELLED"
    ) {
      return NextResponse.json({
        message:
          userData.subscriptionStatus === "TRIAL"
            ? "You are on a free trial. No PayPal subscription to sync."
            : "You don't have an active subscription to sync.",
        subscriptionStatus: userData.subscriptionStatus,
        hasActiveTrial: userData.hasActiveTrial,
        synced: false,
      });
    }

    // Check if user has a PayPal subscription ID
    if (!userData.paypalSubscriptionId) {
      return NextResponse.json(
        {
          error: "No PayPal subscription found",
          message: "You don't have an active PayPal subscription to sync.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 3️⃣ Load PayPal credentials from Vercel env vars
    // -------------------------------------------------
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    const PAYPAL_MODE = process.env.PAYPAL_MODE ?? "sandbox";

    const PAYPAL_BASE_URL =
      PAYPAL_MODE === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        {
          error: "PayPal configuration missing",
          details: {
            hasClientId: !!PAYPAL_CLIENT_ID,
            hasClientSecret: !!PAYPAL_CLIENT_SECRET,
          },
        },
        { status: 500 }
      );
    }

    // -------------------------------------------------
    // 4️⃣ Get an access token from PayPal
    // -------------------------------------------------
    const basicAuth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);

    const tokenRes = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return NextResponse.json(
        {
          error: "Failed to obtain PayPal access token",
          status: tokenRes.status,
          body: err,
        },
        { status: tokenRes.status }
      );
    }

    const { access_token } = (await tokenRes.json()) as {
      access_token: string;
    };

    // -------------------------------------------------
    // 5️⃣ Get subscription details from PayPal
    // -------------------------------------------------
    const subscriptionRes = await fetch(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${userData.paypalSubscriptionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!subscriptionRes.ok) {
      const err = await subscriptionRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "Failed to fetch subscription from PayPal",
          details: err,
        },
        { status: subscriptionRes.status }
      );
    }

    const subscriptionData = await subscriptionRes.json();

    // -------------------------------------------------
    // 6️⃣ Map PayPal status to our database status
    // -------------------------------------------------
    // PayPal statuses: APPROVAL_PENDING, APPROVED, ACTIVE, SUSPENDED, CANCELLED, EXPIRED
    const paypalStatus = subscriptionData.status;
    let dbSubscriptionStatus = "INACTIVE";

    if (paypalStatus === "ACTIVE") {
      dbSubscriptionStatus = "ACTIVE";
    } else if (paypalStatus === "SUSPENDED") {
      dbSubscriptionStatus = "SUSPENDED";
    } else if (
      paypalStatus === "CANCELLED" ||
      paypalStatus === "EXPIRED"
    ) {
      dbSubscriptionStatus = "INACTIVE";
    } else if (
      paypalStatus === "APPROVAL_PENDING" ||
      paypalStatus === "APPROVED"
    ) {
      dbSubscriptionStatus = "PENDING";
    }

    // -------------------------------------------------
    // 7️⃣ Update user's subscription status in database
    // -------------------------------------------------
    // Don't overwrite TRIAL status - preserve it if user is on trial
    const finalStatus = userData.subscriptionStatus === "TRIAL" 
      ? "TRIAL" 
      : dbSubscriptionStatus;
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: finalStatus,
        // If subscription is cancelled/inactive, mark trial as ended (prevents reactivation)
        // But preserve active trial status if user is on trial
        hasTrialEnded:
          finalStatus === "INACTIVE" && !userData.hasActiveTrial
            ? true 
            : userData.hasActiveTrial
            ? false
            : true,
      },
      select: {
        id: true,
        subscriptionStatus: true,
        paypalSubscriptionId: true,
        hasActiveTrial: true,
      },
    });

    console.log(
      `[paypal/sync] ✅ Synced subscription for user ${user.id}: ${paypalStatus} → ${dbSubscriptionStatus}`
    );

    // -------------------------------------------------
    // 8️⃣ Return sync result
    // -------------------------------------------------
    return NextResponse.json({
      synced: true,
      subscriptionStatus: updatedUser.subscriptionStatus,
      paypalStatus: paypalStatus,
      paypalSubscriptionId: updatedUser.paypalSubscriptionId,
      message: `Subscription status synced successfully: ${paypalStatus}`,
    });
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
