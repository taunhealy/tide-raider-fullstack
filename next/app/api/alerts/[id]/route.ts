import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Use NEXT_PUBLIC_API_URL if set, otherwise default to production
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

/**
 * Proxy to backend /api/alerts/:id
 * The backend handles all alert operations (GET, PUT, PATCH, DELETE)
 */
async function handleRequest(req: NextRequest, method: string, id: string) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const queryString = req.nextUrl.searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/alerts/${id}${queryString ? `?${queryString}` : ""}`;

    console.log(`[alerts] Proxying ${method} to backend: ${backendUrl}`);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      // Forward auth token from cookie as Authorization header
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      // Also forward cookies
      Cookie: cookieStore.toString(),
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
