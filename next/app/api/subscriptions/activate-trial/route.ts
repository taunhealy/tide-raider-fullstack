import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { promoCode } = await request.json();

    if (!promoCode || typeof promoCode !== "string") {
      return NextResponse.json(
        { error: "Invalid request", message: "Promo code is required" },
        { status: 400 }
      );
    }

    const getBackendUrl = () => {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      const isDevelopment = process.env.NODE_ENV === "development";

      if (isDevelopment) {
        return envUrl || "http://localhost:4001";
      }

      return envUrl || "https://tide-raider-backend.fly.dev";
    };

    const BACKEND_URL = getBackendUrl();

    // Get auth token from cookies to pass to backend
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Proxy to backend activate-trial-with-code endpoint
    console.log(
      `[subscriptions] Proxying activate-trial-with-code to: ${BACKEND_URL}/api/subscriptions/activate-trial-with-code`
    );

    const response = await fetch(
      `${BACKEND_URL}/api/subscriptions/activate-trial-with-code`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ promoCode }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[subscriptions] Activate trial with code error:", error);
    return NextResponse.json(
      {
        error: "Failed to activate trial",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

