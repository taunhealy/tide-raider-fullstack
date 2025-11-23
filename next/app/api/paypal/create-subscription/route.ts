import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/app/lib/api-config";

/**
 * POST /api/paypal/create-subscription
 * Proxy to backend to create PayPal subscription
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    console.log("[create-subscription] Starting request", {
      hasAuthToken: !!authToken,
      authTokenPrefix: authToken?.substring(0, 10),
    });

    if (!authToken) {
      console.error("[create-subscription] No auth token found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backendUrl = getBackendUrl();
    console.log("[create-subscription] Backend URL:", backendUrl);

    const targetUrl = `${backendUrl}/api/paypal/create-subscription`;
    console.log("[create-subscription] Calling:", targetUrl);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        Cookie: `auth-token=${authToken}`,
      },
      credentials: "include",
    });

    console.log("[create-subscription] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[create-subscription] Error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: `HTTP ${response.status}: ${response.statusText}`, details: errorText };
      }
      
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log("[create-subscription] Success:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[create-subscription] Exception:", error);
    return NextResponse.json(
      {
        error: "Failed to create subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

