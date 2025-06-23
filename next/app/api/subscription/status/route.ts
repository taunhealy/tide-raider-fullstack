import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { isSubscribed: false, hasActiveTrial: false },
      { status: 401 }
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
    isSubscribed: user?.subscriptionStatus === "ACTIVE",
    hasActiveTrial: user?.hasActiveTrial || false,
  });
}
