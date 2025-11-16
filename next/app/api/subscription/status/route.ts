import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { isSubscribed: false, hasActiveTrial: false },
        { status: 200 } // Return 200 instead of 401 for unauthenticated users
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        subscriptionStatus: true,
        hasActiveTrial: true,
        trialEndDate: true,
        paypalSubscriptionId: true,
      },
    });

    return NextResponse.json({
      isSubscribed: user?.subscriptionStatus === "ACTIVE" || false,
      hasActiveTrial: user?.hasActiveTrial || false,
    });
  } catch (error) {
    // Database not accessible - return default values
    console.error("[subscription/status] Database error:", error);
    return NextResponse.json({
      isSubscribed: false,
      hasActiveTrial: false,
    });
  }
}
