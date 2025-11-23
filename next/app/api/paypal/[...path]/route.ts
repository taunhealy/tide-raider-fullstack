import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_CONFIG } from "@/app/lib/api-config";

const BACKEND_URL = API_CONFIG.baseUrl;

/**
 * Proxy for PayPal endpoints
 * Forwards authenticated requests to backend /api/paypal/*
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return handleRequest(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return handleRequest(request, params, "POST");
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return handleRequest(request, params, "PUT");
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return handleRequest(request, params, "DELETE");
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    // Build backend URL
    const path = params.path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/paypal/${path}${
      searchParams ? `?${searchParams}` : ""
    }`;

    console.log(`[PayPal Proxy] ${method} ${backendUrl}`);

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      Cookie: cookieStore.toString(),
    };

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    // Add body for POST/PUT requests
    if ((method === "POST" || method === "PUT") && request.body) {
      const body = await request.text();
      if (body) {
        requestOptions.body = body;
      }
    }

    // Forward request to backend
    const response = await fetch(backendUrl, requestOptions);

    // Get response data
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("[PayPal Proxy] Backend error:", {
        status: response.status,
        data,
      });
    }

    // Forward response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[PayPal Proxy] Error:", error);
    return NextResponse.json(
      {
        error: "PayPal proxy error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

