/**
 * Next.js API Proxy Route
 *
 * This proxy handles cross-domain authentication:
 * 1. Frontend calls Next.js API route (same domain = cookies work)
 * 2. Next.js API route gets session token from NextAuth
 * 3. Next.js API route forwards request to backend with token in header
 * 4. No cookie parsing needed, no cross-domain issues
 *
 * Usage: /api/backend-proxy/api/alerts -> proxies to BACKEND_URL/api/alerts
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Route segment config - ensure this route is dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Handle all HTTP methods
// Note: In Next.js 15+, params is a Promise and must be awaited
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxy(req, "GET", path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxy(req, "POST", path);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxy(req, "PUT", path);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxy(req, "PATCH", path);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxy(req, "DELETE", path);
}

async function handleProxy(
  req: NextRequest,
  method: string,
  pathSegments: string[]
) {
  try {
    console.log(`[proxy] ${method} request received for path:`, pathSegments);

    // Get session from NextAuth - need to pass headers for App Router
    // Create headers object from request for getServerSession
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    // Get session to verify user is authenticated
    const session = await getServerSession(authOptions);
    console.log(`[proxy] Session found:`, !!session, session?.user?.id);

    // Reconstruct the backend path
    const path = `/${pathSegments.join("/")}`;
    const searchParams = req.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";
    const backendUrl = `${BACKEND_URL}${path}${queryString}`;

    // Prepare headers for backend request
    const backendHeaders: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Get the NextAuth session token from cookies
    // The backend expects this cookie value (which is a signed JWT)
    // Backend will verify it using jwt.verify(token, NEXTAUTH_SECRET)

    // Log all cookies for debugging
    const allCookies = req.cookies.getAll();
    console.log(
      `[proxy] All cookies:`,
      allCookies.map((c) => c.name)
    );

    const sessionToken =
      req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value ||
      null;

    if (sessionToken) {
      backendHeaders.Authorization = `Bearer ${sessionToken}`;
      console.log(
        `[proxy] ✅ Added auth token for ${path} (length: ${sessionToken.length}, first 20 chars: ${sessionToken.substring(0, 20)}...)`
      );
    } else if (session) {
      // Session exists but no cookie - this shouldn't happen
      console.log(
        `[proxy] ⚠️ WARNING: Session exists but no session token cookie found`
      );
      console.log(
        `[proxy] Available cookies:`,
        allCookies.map((c) => `${c.name} (${c.value.length} chars)`)
      );
    } else {
      console.log(
        `[proxy] ❌ No session or token for ${path} - proceeding without auth`
      );
    }

    console.log(`[proxy] Forwarding ${method} request to: ${backendUrl}`);
    console.log(`[proxy] Headers being sent:`, Object.keys(backendHeaders));

    // Forward request to backend
    const body =
      method !== "GET" && method !== "DELETE" ? await req.text() : undefined;

    const response = await fetch(backendUrl, {
      method,
      headers: backendHeaders,
      body,
    });

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          "Content-Type": contentType || "text/plain",
        },
      });
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      {
        error: "Proxy request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
