import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Proxy to backend /api/alerts/:id
 * The backend handles all alert operations (GET, PUT, PATCH, DELETE)
 */
async function handleRequest(req: NextRequest, method: string, id: string) {
  try {
    const queryString = req.nextUrl.searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/alerts/${id}${queryString ? `?${queryString}` : ""}`;

    console.log(`[alerts] Proxying ${method} to backend: ${backendUrl}`);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      // Forward authorization header if present
      ...(req.headers.get("authorization") && {
        Authorization: req.headers.get("authorization")!,
      }),
    };

    const options: RequestInit = {
      method,
      headers,
      credentials: "include", // Include cookies for auth
    };

    // Add body for POST, PUT, PATCH
    if (method !== "GET" && method !== "DELETE") {
      const body = await req.text();
      options.body = body;
    }

    const response = await fetch(backendUrl, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || `Failed to ${method.toLowerCase()} alert`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[alerts] Backend error (${method}):`, error);
    return NextResponse.json(
      {
        error: `Failed to ${method.toLowerCase()} alert`,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleRequest(req, "GET", id);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleRequest(req, "PUT", id);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleRequest(req, "PATCH", id);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleRequest(req, "DELETE", id);
}
