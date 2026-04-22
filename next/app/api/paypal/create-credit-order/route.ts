import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/app/lib/api-config";

const BACKEND_URL = getBackendUrl();

export async function POST(req: NextRequest) {
  try {
    const backendUrl = `${BACKEND_URL}/api/paypal/create-credit-order`;
    
    // Get body if exists
    let body: any = null;
    try {
      body = await req.json();
    } catch (e) {
      // No body
    }

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.get("cookie") || "",
        Authorization: req.headers.get("authorization") || "",
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[proxy/create-credit-order] Error:", error);
    return NextResponse.json({ error: "Failed to proxy request", message: error.message }, { status: 500 });
  }
}
