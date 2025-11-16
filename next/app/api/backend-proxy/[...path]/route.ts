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
    // Get session from NextAuth (cookies work here since it's same domain)
    const session = await getServerSession(authOptions);

    // Reconstruct the backend path
    const path = `/${pathSegments.join("/")}`;
    const searchParams = req.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";
    const backendUrl = `${BACKEND_URL}${path}${queryString}`;

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add auth token if session exists
    if (session) {
      // Get the NextAuth session token from cookies
      const token =
        req.cookies.get("next-auth.session-token")?.value ||
        req.cookies.get("__Secure-next-auth.session-token")?.value;

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    // Forward request to backend
    const body =
      method !== "GET" && method !== "DELETE" ? await req.text() : undefined;

    const response = await fetch(backendUrl, {
      method,
      headers,
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
