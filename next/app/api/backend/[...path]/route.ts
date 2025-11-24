import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tide-raider-backend-o6rx5gs5rq-ew.a.run.app";

/**
 * Universal backend proxy
 * Forwards all requests to the backend with proper authentication
 * Handles CORS and cookie forwarding automatically
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyToBackend(req, params.path, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyToBackend(req, params.path, "POST");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyToBackend(req, params.path, "PUT");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyToBackend(req, params.path, "PATCH");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyToBackend(req, params.path, "DELETE");
}

async function proxyToBackend(
  req: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Build the backend URL
    const path = pathSegments.join("/");
    const searchParams = req.nextUrl.searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/${path}${searchParams ? `?${searchParams}` : ""}`;

    console.log(`[backend-proxy] ${method} ${backendUrl}`);

    // Get cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      Cookie: cookieStore.toString(),
    };

    // Prepare body for non-GET requests
    let body: string | undefined;
    if (method !== "GET" && method !== "DELETE") {
      try {
        const jsonBody = await req.json();
        body = JSON.stringify(jsonBody);
      } catch {
        // No body or invalid JSON
      }
    }

    // Forward request to backend
    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
      credentials: "include",
    });

    // Get response data
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Return response with same status
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[backend-proxy] Error:", error);
    return NextResponse.json(
      { error: "Proxy error", message: error.message },
      { status: 500 }
    );
  }
}
