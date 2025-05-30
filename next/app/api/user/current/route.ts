import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { SubscriptionStatus } from "@/app/types/subscription";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      hasActiveTrial: true,
      hasTrialEnded: true,
      trialEndDate: true,
      subscriptionStatus: true,
    },
  });

  console.log("User API response:", {
    subscriptionStatus: user?.subscriptionStatus,
    raw: user,
  });

  return NextResponse.json(user);
}
