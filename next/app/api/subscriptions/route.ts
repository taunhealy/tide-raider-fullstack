import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/authOptions";
import { SubscriptionStatus } from "@/app/types/subscription";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // Get auth token from cookies as fallback authentication
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token")?.value || 
                    cookieStore.get("next-auth.session-token")?.value ||
                    cookieStore.get("__Secure-next-auth.session-token")?.value;

  // Get the base URL from environment variable, fallback to a default
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  // If no session and no auth-token, redirect to login
  if (!session?.user?.email && !authToken) {
    return NextResponse.redirect(`${baseUrl}/auth/signin`);
  }

  // Add status parameter to indicate cancelled payment
  const redirectUrl = new URL(`${baseUrl}/pricing`);
  redirectUrl.searchParams.set("status", "payment-cancelled");

  // Redirect to pricing page with status
  return NextResponse.redirect(redirectUrl.toString());
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  // Get auth token from cookies as fallback authentication
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token")?.value || 
                    cookieStore.get("next-auth.session-token")?.value ||
                    cookieStore.get("__Secure-next-auth.session-token")?.value;

  if (!session?.user?.email && !authToken) {
    console.log("[subscriptions] Unauthorized: No session and no auth-token found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, promoCode } = await request.json();
    console.log("Received action:", action); // Debug log

    // Handle trial start FIRST, before any PayPal logic
    if (action === "start-trial") {
      // Proxy to backend instead of using Prisma directly
      // Frontend doesn't have database access in development
      const getBackendUrl = () => {
        const envUrl = process.env.NEXT_PUBLIC_API_URL;
        const isDevelopment = process.env.NODE_ENV === "development";

        // In development, use localhost backend
        if (isDevelopment) {
          if (envUrl?.includes("localhost")) {
            return envUrl.replace("localhost", "127.0.0.1");
          }
          return envUrl || "http://127.0.0.1:4005";
        }

        // In production, use production backend (Google Cloud Run)
        return envUrl || "https://tide-raider-backend-82632174665.europe-west1.run.app";
      };

      const BACKEND_URL = getBackendUrl();

      // No need to re-fetch cookies, they are available at the top of the function

      // Proxy to backend start-trial endpoint
      // If promoCode is provided, use the specialized activation endpoint
      const endpoint = promoCode 
        ? `${BACKEND_URL}/api/subscriptions/activate-trial-with-code`
        : `${BACKEND_URL}/api/subscriptions/start-trial`;

      console.log(
        `[subscriptions] Proxying ${action} to: ${endpoint} ${promoCode ? `with code: ${promoCode}` : ''}`
      );

      let response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authToken ? `Bearer ${authToken}` : "",
            Cookie: cookieStore.toString(),
          },
          credentials: "include",
          body: JSON.stringify({ promoCode }),
        });
      } catch (fetchError) {
        console.error("[subscriptions] Fetch error:", fetchError);
        return NextResponse.json(
          {
            error: "Failed to connect to backend",
            message:
              fetchError instanceof Error
                ? fetchError.message
                : "Network error",
          },
          { status: 503 }
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
            message: errorText || "Unknown error",
          };
        }
        console.error("[subscriptions] Backend error:", {
          status: response.status,
          error: errorData,
        });
        return NextResponse.json(
          {
            error: errorData.error || "Failed to start trial",
            message: errorData.message || errorData.error || "Unknown error",
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log("[subscriptions] Trial started successfully:", data);
      return NextResponse.json(data);
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
        return handleCreate(promoCode);
      case "unsubscribe":
      case "cancel":
        if (!session?.user?.email) {
          return NextResponse.json({ error: "Email session required for this action" }, { status: 400 });
        }
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
        if (!session?.user?.email) {
          return NextResponse.json({ error: "Email session required for this action" }, { status: 400 });
        }
        return handleSuspend(session.user.email, access_token, baseUrl);
      case "activate":
        if (!session?.user?.email) {
          return NextResponse.json({ error: "Email session required for this action" }, { status: 400 });
        }
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

async function handleCreate(promoCode?: string) {
  try {
    // Proxy to backend instead of calling PayPal directly
    // This ensures we always use the correct plan ID from backend environment
    const getBackendUrl = () => {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      const isDevelopment = process.env.NODE_ENV === "development";

      // In development, use localhost backend
      if (isDevelopment) {
        if (envUrl?.includes("localhost")) {
          return envUrl.replace("localhost", "127.0.0.1");
        }
        return envUrl || "http://127.0.0.1:4005";
      }

      // In production, use production backend (Google Cloud Run)
      return envUrl || "https://tide-raider-backend-82632174665.europe-west1.run.app";
    };

    const BACKEND_URL = getBackendUrl();

    // authToken and cookieStore are passed from the caller or retrieved here if needed
    // But handleCreate is called from POST which already has them.
    // However, since handleCreate is defined outside POST, we need to pass them or re-retrieve.
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value || 
                      cookieStore.get("next-auth.session-token")?.value ||
                      cookieStore.get("__Secure-next-auth.session-token")?.value;

    // Proxy to backend create-subscription endpoint
    const response = await fetch(
      `${BACKEND_URL}/api/paypal/create-subscription`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
          Cookie: cookieStore.toString(),
        },
        credentials: "include",
        body: JSON.stringify({ promoCode }),
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
