import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { adId } = await request.json();

    if (!adId) {
      return NextResponse.json({ error: "Ad ID is required" }, { status: 400 });
    }

    // Get the ad
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    // In a real implementation, you would capture the PayPal payment here
    // using the PayPal API. For simplicity, we'll just update the ad status.

    // For sandbox/development, we'll just mark the ad as active
    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        status: "active",
      },
    });

    return NextResponse.json({ success: true, ad: updatedAd });
  } catch (error) {
    console.error("Error capturing payment:", error);
    return NextResponse.json(
      { error: "Failed to capture payment" },
      { status: 500 }
    );
  }
}
