import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/app/lib/server-auth";
import { PrismaClient } from "@prisma/client";

// Initialize Prisma Client
const prisma = new PrismaClient();

/**
 * GET /api/paypal/subscription-status
 * Get the current user's subscription status from the database
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
    // 2️⃣ Get user data from database
    // -------------------------------------------------
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        subscriptionStatus: true,
        hasActiveTrial: true,
        paypalSubscriptionId: true,
        trialEndDate: true,
        hasTrialEnded: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // -------------------------------------------------
    // 3️⃣ Determine if user has premium access
    // -------------------------------------------------
    const isSubscribed = userData.subscriptionStatus === "ACTIVE";
    const hasActiveTrial = userData.hasActiveTrial || false;
    const isPremium = isSubscribed || hasActiveTrial;

    // -------------------------------------------------
    // 4️⃣ Return subscription status
    // -------------------------------------------------
    return NextResponse.json({
      subscriptionStatus: userData.subscriptionStatus || null,
      hasActiveTrial,
      paypalSubscriptionId: userData.paypalSubscriptionId || null,
      isPremium,
      // Additional info that might be useful
      trialEndDate: userData.trialEndDate,
      hasTrialEnded: userData.hasTrialEnded,
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
