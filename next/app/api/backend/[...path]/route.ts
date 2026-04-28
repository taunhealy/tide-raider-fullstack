import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/app/lib/api-config";

const BACKEND_URL = getBackendUrl();

/**
 * Universal backend proxy
 * Forwards all requests to the backend with proper authentication
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToBackend(req, path, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToBackend(req, path, "POST");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToBackend(req, path, "PUT");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToBackend(req, path, "PATCH");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToBackend(req, path, "DELETE");
}

async function proxyToBackend(
  req: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = pathSegments.join("/");
    const searchParams = req.nextUrl.searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/${path}${searchParams ? `?${searchParams}` : ""}`;

    console.log(`[backend-proxy] ${method} ${backendUrl}`);

    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      Cookie: cookieStore.toString(),
    };

    let body: string | undefined;
    if (method !== "GET" && method !== "DELETE") {
      try {
        const jsonBody = await req.json();
        body = JSON.stringify(jsonBody);
      } catch {
        // No body or invalid JSON
      }
    }

    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType?.includes("application/json")) {
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.warn("[backend-proxy] Failed to parse JSON, falling back to text");
        data = { error: "Malformed JSON", message: "Backend returned invalid JSON" };
      }
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      console.error(`[backend-proxy] Backend error ${response.status}:`, typeof data === 'object' ? JSON.stringify(data) : data);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[backend-proxy] Proxy operation failed:", error.stack || error);
    return NextResponse.json(
      { error: "Proxy error", message: error.message },
      { status: 500 }
    );
  }
}
