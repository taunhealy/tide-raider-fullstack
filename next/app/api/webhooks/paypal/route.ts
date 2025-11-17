import { NextResponse } from "next/server";

// Use NEXT_PUBLIC_API_URL if set, otherwise default to production
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

/**
 * POST /api/webhooks/paypal
 * Proxy PayPal webhook events to the backend
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Forward the webhook to the backend
    const response = await fetch(`${BACKEND_URL}/api/paypal/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Backend webhook error:", errorData);
      return NextResponse.json(
        { error: "Webhook handler failed", details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Webhook proxy error:", error);
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
