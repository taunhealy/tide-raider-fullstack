import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/authOptions";
import { SubscriptionStatus } from "@/app/types/subscription";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // Get the base URL from environment variable, fallback to a default
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  // If no session, redirect to login
  if (!session?.user?.email) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  // Add status parameter to indicate cancelled payment
  const redirectUrl = new URL(`${baseUrl}/pricing`);
  redirectUrl.searchParams.set("status", "payment-cancelled");

  // Redirect to pricing page with status
  return NextResponse.redirect(redirectUrl.toString());
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action } = await request.json();
    console.log("Received action:", action); // Debug log

    // Handle trial start FIRST, before any PayPal logic
    if (action === "start-trial") {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (user.hasActiveTrial || user.hasTrialEnded) {
        return NextResponse.json(
          { error: "Trial already used" },
          { status: 400 }
        );
      }

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      await prisma.user.update({
        where: { email: session.user.email },
        data: {
          hasActiveTrial: true,
          trialStartDate: new Date(),
          trialEndDate: trialEndDate,
          subscriptionStatus: "TRIAL",
        },
      });

      return NextResponse.json({ success: true });
    }

    // Only proceed with PayPal logic for non-trial actions
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "PayPal configuration missing" },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    // Get PayPal access token
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenResponse.ok) {
      console.error("PayPal token error:", await tokenResponse.text());
      throw new Error("Failed to get PayPal access token");
    }

    const { access_token } = await tokenResponse.json();

    switch (action) {
      case "create":
        return handleCreate();
      case "unsubscribe":
      case "cancel":
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { paypalSubscriptionId: true },
        });
        return handleCancel(
          session.user.email,
          user?.paypalSubscriptionId || "",
          access_token,
          baseUrl
        );
      case "suspend":
        return handleSuspend(session.user.email, access_token, baseUrl);
      case "activate":
        return handleActivate(session.user.email, access_token, baseUrl);
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Subscription operation failed" },
      { status: 500 }
    );
  }
}

async function handleCreate() {
  try {
    // Proxy to backend instead of calling PayPal directly
    // This ensures we always use the correct plan ID from backend environment
    const getBackendUrl = () => {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      // If env URL is localhost, always use production (database is live)
      if (envUrl?.includes("localhost")) {
        return "https://tide-raider-backend.fly.dev";
      }
      return envUrl || "https://tide-raider-backend.fly.dev";
    };

    const BACKEND_URL = getBackendUrl();

    // Get auth token from cookies to pass to backend
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Proxy to backend create-subscription endpoint
    const response = await fetch(
      `${BACKEND_URL}/api/paypal/create-subscription`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          Cookie: cookieStore.toString(),
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();

    // Backend returns { subscriptionId, approvalUrl, status }
    if (data.approvalUrl) {
      return NextResponse.json({ url: data.approvalUrl });
    }

    throw new Error("No approval URL received from backend");
  } catch (error) {
    console.error("Subscription creation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create subscription",
      },
      { status: 500 }
    );
  }
}

async function handleCancel(
  userEmail: string,
  subscriptionId: string,
  accessToken: string,
  baseUrl: string
) {
  if (subscriptionId) {
    const response = await fetch(
      `${baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reason: "Customer requested cancellation" }),
      }
    );

    if (!response.ok) {
      console.error("PayPal cancellation failed:", await response.text());
    }
  }

  await prisma.user.update({
    where: { email: userEmail },
    data: {
      paypalSubscriptionId: null,
      subscriptionStatus: SubscriptionStatus.CANCELLED,
    },
  });

  return NextResponse.json({ success: true });
}

async function handleSuspend(
  userEmail: string,
  accessToken: string,
  baseUrl: string
) {
  // Get the subscription ID from the database first
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { paypalSubscriptionId: true },
  });

  if (!user || !user.paypalSubscriptionId) {
    throw new Error("No active subscription found");
  }

  const response = await fetch(
    `${baseUrl}/v1/billing/subscriptions/${user.paypalSubscriptionId}/suspend`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ reason: "Customer requested suspension" }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to suspend subscription");
  }

  return NextResponse.json({ success: true });
}

async function handleActivate(
  userEmail: string,
  accessToken: string,
  baseUrl: string
) {
  // Get the subscription ID from the database first
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { paypalSubscriptionId: true },
  });

  if (!user || !user.paypalSubscriptionId) {
    throw new Error("No active subscription found");
  }

  const response = await fetch(
    `${baseUrl}/v1/billing/subscriptions/${user.paypalSubscriptionId}/activate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to activate subscription");
  }

  return NextResponse.json({ success: true });
}
