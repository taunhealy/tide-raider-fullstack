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

// Use NEXT_PUBLIC_API_URL if set, otherwise default to production
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

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

    // Check if this is a forecast endpoint (which uses optionalAuth on backend)
    const isForecastEndpoint = pathSegments.join("/").includes("forecast");

    // Get session from NextAuth - need to pass headers for App Router
    // Create headers object from request for getServerSession
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    // Get session to verify user is authenticated
    // For forecast endpoints, this is optional (backend uses optionalAuth)
    let session = null;
    try {
      session = await getServerSession(authOptions);
      console.log(`[proxy] Session found:`, !!session, session?.user?.id);
    } catch (sessionError) {
      // If session retrieval fails, continue without session (especially for forecast endpoints)
      if (isForecastEndpoint) {
        console.log(
          `[proxy] Session retrieval failed for forecast endpoint, continuing without auth`
        );
      } else {
        console.warn(`[proxy] Session retrieval failed:`, sessionError);
      }
    }

    // For forecast endpoints without session, skip auth and proceed directly
    if (isForecastEndpoint && !session) {
      console.log(
        `[proxy] Forecast endpoint without session - proceeding without authentication`
      );
    }

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

    // First, check for backend OAuth JWT cookie (auth-token)
    // This is set by the backend OAuth flow when user signs in
    // For forecast endpoints without session, skip token retrieval
    const authTokenCookie = req.cookies.get("auth-token")?.value;
    let jwtToken: any = null;
    let tokenSource = "none";

    // Skip token retrieval for forecast endpoints if no session (backend uses optionalAuth)
    if (isForecastEndpoint && !session && !authTokenCookie) {
      console.log(
        `[proxy] Forecast endpoint - skipping token retrieval, proceeding without auth`
      );
    } else if (authTokenCookie) {
      // Backend OAuth sets auth-token cookie - use it directly
      console.log(`[proxy] ✅ Found auth-token cookie from backend OAuth`);
      try {
        // Verify the token is valid (optional - backend will verify anyway)
        if (secret) {
          jwtToken = jwt.verify(authTokenCookie, secret) as any;
          tokenSource = "auth-token-cookie";
          console.log(
            `[proxy] ✅ Verified auth-token cookie: userId: ${jwtToken.id || jwtToken.sub}, email: ${jwtToken.email}`
          );
        } else {
          // If no secret, still use the token (backend will verify)
          tokenSource = "auth-token-cookie-unverified";
          console.log(
            `[proxy] ⚠️ Using auth-token cookie without verification (no secret)`
          );
        }
      } catch (error) {
        console.log(`[proxy] ⚠️ auth-token cookie verification failed:`, error);
      }
    }

    // If no backend cookie, try NextAuth token
    // Skip for forecast endpoints if no session (backend uses optionalAuth)
    if (!jwtToken && (!isForecastEndpoint || session)) {
      try {
        jwtToken = await getToken({
          req,
          secret: secret,
        });
        if (jwtToken) {
          tokenSource = "nextauth-token";
        }
      } catch (tokenError) {
        // If token retrieval fails for forecast endpoint, continue without auth
        if (isForecastEndpoint) {
          console.log(
            `[proxy] Token retrieval failed for forecast endpoint, continuing without auth`
          );
        } else {
          console.warn(`[proxy] Token retrieval failed:`, tokenError);
        }
      }
    }

    console.log(
      `[proxy] JWT token from ${tokenSource}:`,
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
      // Skip for forecast endpoints if no session (backend uses optionalAuth)
      if (session?.user?.id && secret && (!isForecastEndpoint || session)) {
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
      } else if (isForecastEndpoint && !session) {
        console.log(
          `[proxy] Forecast endpoint - proceeding without authentication`
        );
      }
    }

    // Add Authorization header if we have a token
    if (jwtToken) {
      if (
        tokenSource === "auth-token-cookie" ||
        tokenSource === "auth-token-cookie-unverified"
      ) {
        // Use the backend OAuth cookie directly
        backendHeaders.Authorization = `Bearer ${authTokenCookie}`;
        console.log(
          `[proxy] 🔐 Using auth-token cookie directly for userId: ${jwtToken.id || jwtToken.sub}, email: ${jwtToken.email}`
        );
      } else if (!secret) {
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

    // Handle 429 gracefully - return empty/default responses
    if (response.status === 429) {
      console.warn(
        `[proxy] Rate limited for ${path}, returning empty response`
      );
      // Return appropriate empty response based on endpoint
      if (path.includes("/raid-logs")) {
        // Frontend expects { entries: [], total: 0 } structure
        return NextResponse.json({ entries: [], total: 0 }, { status: 200 });
      }
      if (path.includes("/blog-posts")) {
        return NextResponse.json(
          { posts: [], trip: null, categories: [] },
          { status: 200 }
        );
      }
      if (path.includes("/forecast")) {
        // Return null for forecast (frontend handles null gracefully)
        return NextResponse.json(null, { status: 200 });
      }
      if (path.includes("/filtered-beaches")) {
        // Return empty beaches structure matching BeachInitialData
        return NextResponse.json(
          {
            beaches: [],
            scores: {},
            forecast: null,
            totalCount: 0,
          },
          { status: 200 }
        );
      }
      if (
        path.includes("/beaches") &&
        !path.includes("/filtered-beaches") &&
        !path.includes("/beaches/search")
      ) {
        // Return empty beaches array for /api/beaches endpoint
        return NextResponse.json({ beaches: [] }, { status: 200 });
      }
      // Default empty response
      return NextResponse.json(
        { error: "Too many requests, please try again later" },
        { status: 429 }
      );
    }

    // Handle 404 and 500 errors for forecast endpoints gracefully
    // Frontend expects null when forecast data is unavailable
    if (
      path.includes("/forecast") &&
      (response.status === 404 || response.status === 500)
    ) {
      console.warn(
        `[proxy] Forecast endpoint returned ${response.status} for ${path}, returning null`
      );
      return NextResponse.json(null, { status: 200 });
    }

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

    // For forecast endpoints, return null instead of error (frontend handles null gracefully)
    if (pathSegments.join("/").includes("forecast")) {
      console.warn(
        `[proxy] Forecast endpoint error, returning null:`,
        error instanceof Error ? error.message : "Unknown error"
      );
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(
      {
        error: "Proxy request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
