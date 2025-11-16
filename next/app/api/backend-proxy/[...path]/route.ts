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
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";
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

    // Get the actual JWT token from NextAuth
    // getToken() extracts and decodes the JWT from the encrypted session token
    // This is what the backend expects - a plain JWT that can be verified
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    console.log(
      `[proxy] Secret available:`,
      !!secret,
      secret ? `(length: ${secret.length})` : ""
    );

    // Log all cookies for debugging
    const allCookies = req.cookies.getAll();
    console.log(
      `[proxy] All cookies:`,
      allCookies.map((c) => c.name)
    );

    const jwtToken = await getToken({
      req,
      secret: secret,
    });

    console.log(
      `[proxy] JWT token from getToken:`,
      !!jwtToken,
      jwtToken
        ? `sub: ${jwtToken.sub || jwtToken.id}, email: ${jwtToken.email}`
        : "null"
    );

    if (!jwtToken) {
      console.log(`[proxy] ⚠️ getToken() returned null - checking session...`);
      console.log(
        `[proxy] Session user:`,
        session?.user?.id,
        session?.user?.email
      );

      // Fallback: If getToken() fails but we have a session, create JWT from session
      if (session?.user?.id && secret) {
        console.log(`[proxy] Creating JWT from session data as fallback`);
        const payload: Record<string, any> = {
          sub: session.user.id,
          id: session.user.id,
          email: session.user.email || undefined,
        };

        console.log(
          `[proxy] 🔑 Using secret to sign JWT (fallback) (length: ${secret.length}, first 10 chars: ${secret.substring(0, 10)}...)`
        );
        const newJWT = jwt.sign(payload, secret, {
          expiresIn: "7d",
          algorithm: "HS256",
        });

        backendHeaders.Authorization = `Bearer ${newJWT}`;
        console.log(
          `[proxy] ✅ Created JWT from session for ${path} (length: ${newJWT.length})`
        );
        console.log(
          `[proxy] 🔐 Auth token created (fallback) for userId: ${session.user.id}, email: ${session.user.email}`
        );
      } else if (session?.user?.id && !secret) {
        console.error(`[proxy] ❌ Cannot create JWT: secret not configured`);
      }
    }

    // jwtToken is the decoded JWT payload from NextAuth's encrypted session token
    // We need to create a new plain JWT that the backend can verify with jwt.verify()
    if (jwtToken) {
      if (!secret) {
        console.error(
          `[proxy] ❌ NEXTAUTH_SECRET or AUTH_SECRET not configured`
        );
      } else {
        // Create a new plain JWT from the decoded token payload
        // This JWT can be verified by the backend using jwt.verify()
        const payload: Record<string, any> = {
          sub: jwtToken.sub || jwtToken.id,
          id: jwtToken.id || jwtToken.sub,
          email: jwtToken.email,
        };

        // Include exp and iat if they exist
        if (jwtToken.exp) payload.exp = jwtToken.exp;
        if (jwtToken.iat) payload.iat = jwtToken.iat;

        console.log(
          `[proxy] 🔑 Using secret to sign JWT (length: ${secret.length}, first 10 chars: ${secret.substring(0, 10)}...)`
        );
        const newJWT = jwt.sign(payload, secret, {
          expiresIn: "7d", // Match NextAuth's default
          algorithm: "HS256", // Use HS256 like NextAuth
        });

        backendHeaders.Authorization = `Bearer ${newJWT}`;
        console.log(
          `[proxy] ✅ Created new JWT from token object for ${path} (length: ${newJWT.length})`
        );
        console.log(
          `[proxy] 🔐 Auth token created for userId: ${jwtToken.sub || jwtToken.id}, email: ${jwtToken.email}`
        );
      }
    } else if (session) {
      console.log(
        `[proxy] ⚠️ WARNING: Session exists but getToken() returned null`
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
