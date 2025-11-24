import { NextRequest, NextResponse } from "next/server";

// Edge runtime – runs on Vercel’s edge network
export const runtime = "edge";

export async function POST(req: NextRequest) {
  // -------------------------------------------------
  // 1️⃣ Parse the request body (optional)
  // -------------------------------------------------
  // We don't strictly need the body for the subscription creation
  // unless we want to pass custom user data to PayPal.
  // const body = await req.json().catch(() => ({}));

  // -------------------------------------------------
  // 2️⃣ Load PayPal credentials from Vercel env vars
  // -------------------------------------------------
  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
  const PAYPAL_PLAN_ID = process.env.PAYPAL_PLAN_ID;
  const PAYPAL_MODE = process.env.PAYPAL_MODE ?? "sandbox";
  const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.tideraider.com";

  // Debug: log first few chars of env vars (no secrets) to verify they are loaded
  console.log('[PayPal Edge] Env vars loaded', {
    clientIdPrefix: PAYPAL_CLIENT_ID?.slice(0, 10),
    clientSecretPrefix: PAYPAL_CLIENT_SECRET?.slice(0, 10),
    planIdPrefix: PAYPAL_PLAN_ID?.slice(0, 10),
    mode: PAYPAL_MODE,
  });

  const PAYPAL_BASE_URL =
    PAYPAL_MODE === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || !PAYPAL_PLAN_ID) {
    return NextResponse.json(
      {
        error: "PayPal configuration missing",
        details: {
          hasClientId: !!PAYPAL_CLIENT_ID,
          hasClientSecret: !!PAYPAL_CLIENT_SECRET,
          hasPlanId: !!PAYPAL_PLAN_ID,
        },
      },
      { status: 500 }
    );
  }

  // -------------------------------------------------
  // 3️⃣ Get an access token from PayPal
  // -------------------------------------------------
  // Edge runtime does not have Node's Buffer, use btoa instead
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
  // 4️⃣ Create the subscription with PayPal
  // -------------------------------------------------
  const subscriptionRes = await fetch(
    `${PAYPAL_BASE_URL}/v1/billing/subscriptions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        plan_id: PAYPAL_PLAN_ID,
        application_context: {
          brand_name: "Tide Raider",
          locale: "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${NEXT_PUBLIC_BASE_URL}/checkout/success`,
          cancel_url: `${NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
        },
      }),
    }
  );

  if (!subscriptionRes.ok) {
    const err = await subscriptionRes.json().catch(() => ({}));
    return NextResponse.json(
      {
        error: "Failed to create PayPal subscription",
        details: err,
      },
      { status: subscriptionRes.status }
    );
  }

  const data = (await subscriptionRes.json()) as {
    id: string;
    status: string;
    links?: Array<{ rel: string; href: string }>;
  };

  // -------------------------------------------------
  // 5️⃣ Return the approval URL (or subscription ID) to the client
  // -------------------------------------------------
  const approvalUrl = data.links?.find((l) => l.rel === "approve")?.href;

  if (!approvalUrl) {
    return NextResponse.json(
      { error: "No approval URL returned from PayPal" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    subscriptionId: data.id,
    approvalUrl,
    status: data.status,
  });
}