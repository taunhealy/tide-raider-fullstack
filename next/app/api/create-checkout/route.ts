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
      "https://api-m.paypal.com/v1/oauth2/token",
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

    const { access_token } = await tokenResponse.json();

    // Create subscription
    const response = await fetch(
      "https://api-m.paypal.com/v1/billing/subscriptions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          plan_id: process.env.PAYPAL_PLAN_ID,
          subscriber: {
            email_address: session.user.email,
            name: {
              given_name: session.user.name?.split(" ")[0] || "",
              surname: session.user.name?.split(" ").slice(1).join(" ") || "",
            },
          },
          application_context: {
            brand_name: "Tide Raider",
            user_action: "SUBSCRIBE_NOW",
            return_url: `${process.env.NEXTAUTH_URL}/subscription/success`,
            cancel_url: `${process.env.NEXTAUTH_URL}/subscription/cancel`,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create subscription");
    }

    const subscription = await response.json();

    // Return the approval URL
    const approvalUrl = subscription.links.find(
      (link: any) => link.rel === "approve"
    ).href;

    return NextResponse.json({ url: approvalUrl });
  } catch (error) {
    console.error("Checkout creation error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
