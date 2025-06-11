import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { AD_CATEGORIES } from "@/app/lib/advertising/constants";
import { ADVENTURE_AD_CATEGORIES } from "@/app/lib/advertising/constants";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { adId } = await request.json();
    console.log("Processing checkout for ad:", adId);

    // Get the ad
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    // Verify PayPal configuration
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error("Missing PayPal configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get PayPal access token
    const tokenResponse = await fetch(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      }
    );

    const tokenData = await tokenResponse.json();
    console.log("Token response:", tokenData);

    if (!tokenData.access_token) {
      console.error("Failed to get PayPal access token:", tokenData);
      throw new Error("Failed to get PayPal access token");
    }

    const { access_token } = tokenData;

    // For development/testing, let's create a mock PayPal flow
    if (process.env.NODE_ENV === "development" || !tokenData.access_token) {
      console.log("Using mock PayPal flow for development");

      // Update ad with a mock order ID
      await prisma.ad.update({
        where: { id: adId },
        data: {
          paypalSubscriptionId: `mock_order_${Date.now()}`,
          status: "active", // Auto-activate in development
        },
      });

      // Return a mock success URL that will redirect back to your site
      return NextResponse.json({
        url: `${process.env.NEXTAUTH_URL}/advertising/success?adId=${adId}&mock=true`,
      });
    }

    // Get monthly price based on category type and category
    let monthlyPrice = 0;
    const categoryType = ad.categoryType || "local";

    if (categoryType === "adventure") {
      monthlyPrice =
        ADVENTURE_AD_CATEGORIES[
          ad.category as keyof typeof ADVENTURE_AD_CATEGORIES
        ]?.monthlyPrice || 0;
    } else {
      monthlyPrice =
        AD_CATEGORIES[ad.category as keyof typeof AD_CATEGORIES]
          ?.monthlyPrice || 0;
    }

    console.log("Monthly price:", monthlyPrice);

    // Create a simple PayPal order
    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: "10.00", // Fixed amount for testing
          },
          description: `Ad placement for ${ad.title || ad.companyName}`,
        },
      ],
      application_context: {
        brand_name: "Tide Raider",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        return_url: `${process.env.NEXTAUTH_URL}/advertising/success?adId=${adId}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/advertising/cancel`,
      },
    };


    const response = await fetch(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(orderPayload),
      }
    );

    const responseText = await response.text();
    console.log("PayPal API response status:", response.status);
    console.log("PayPal API response:", responseText);

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.error("PayPal API error details:", errorData);
        throw new Error(errorData.message || "Failed to create PayPal order");
      } catch (e) {
        throw new Error(`PayPal API error: ${responseText}`);
      }
    }

    const order = JSON.parse(responseText);

    // Update ad with order ID
    await prisma.ad.update({
      where: { id: adId },
      data: {
        paypalSubscriptionId: order.id,
      },
    });

    // Return the approval URL
    const approvalUrl = order.links.find(
      (link: any) => link.rel === "approve"
    )?.href;

    if (!approvalUrl) {
      throw new Error("No approval URL found in PayPal response");
    }

    return NextResponse.json({ url: approvalUrl });
  } catch (error) {
    console.error("Checkout creation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create checkout",
      },
      { status: 500 }
    );
  }
}
