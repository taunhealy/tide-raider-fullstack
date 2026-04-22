import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/app/lib/api-config";

const BACKEND_URL = getBackendUrl();

export async function POST(req: NextRequest) {
  try {
    const backendUrl = `${BACKEND_URL}/api/paypal/capture-credit-order`;
    
    // Pass the body (orderId) to the backend
    const body = await req.json();

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.get("cookie") || "",
        Authorization: req.headers.get("authorization") || "",
      },
      body: JSON.stringify(body),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[proxy/capture-credit-order] Error:", error);
    return NextResponse.json({ error: "Failed to proxy request", message: error.message }, { status: 500 });
  }
}
