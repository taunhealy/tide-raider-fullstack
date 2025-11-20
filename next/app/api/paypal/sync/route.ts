import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDevelopment = process.env.NODE_ENV === "development";
  
  // In development, use localhost backend (connects to Docker postgres)
  if (isDevelopment) {
    return envUrl || "http://localhost:4001";
  }
  
  // In production, use production backend (connects to Fly.io postgres)
  return envUrl || "https://tide-raider-backend.fly.dev";
};

const BACKEND_URL = getBackendUrl();

/**
 * POST /api/paypal/sync
 * Proxy to backend to sync subscription status from PayPal
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/paypal/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        Cookie: `auth-token=${authToken}`,
      },
      credentials: "include",
    });

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
      console.error("[paypal/sync] Backend error:", {
        status: response.status,
        error: errorData,
        backendUrl: BACKEND_URL,
      });
      return NextResponse.json(
        {
          error: errorData.error || "Failed to sync subscription",
          message: errorData.message || errorData.error || "Unknown error",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[paypal/sync] Error:", error);
    console.error("[paypal/sync] Backend URL:", BACKEND_URL);
    return NextResponse.json(
      {
        error: "Failed to sync subscription",
        message: error instanceof Error ? error.message : "Unknown error",
        details: `Could not connect to backend at ${BACKEND_URL}`,
      },
      { status: 500 }
    );
  }
}
