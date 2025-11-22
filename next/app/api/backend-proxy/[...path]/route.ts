/**
 * Next.js API Proxy Route
 *
 * This proxy handles cross-domain authentication using centralized backend OAuth:
 * 1. Frontend calls Next.js API route (same domain = cookies work)
 * 2. Next.js API route gets auth-token cookie from backend OAuth (Passport)
 * 3. Next.js API route forwards request to backend with token in header
 * 4. All authentication is centralized through backend Passport/OAuth
 * 5. No NextAuth - backend is the single source of truth for auth
 *
 * Usage: /api/backend-proxy/api/alerts -> proxies to BACKEND_URL/api/alerts
 */

import { NextRequest, NextResponse } from "next/server";
// Centralized authentication: Only using backend OAuth (auth-token cookie from Passport)
// No NextAuth - all auth flows through backend Passport/OAuth system

// Use NEXT_PUBLIC_API_URL if set, otherwise use environment-appropriate default
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // If NEXT_PUBLIC_API_URL is explicitly set, always use it (for both dev and prod)
  if (envUrl) {
    return envUrl;
  }

  // Fallback: use Cloud Run backend (we no longer use localhost:4001 or Fly.io)
  return "https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app";
};

const BACKEND_URL = getBackendUrl();

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

    // Centralized authentication: Only use backend OAuth token (auth-token cookie)
    // No NextAuth - all auth goes through backend Passport/OAuth

    // Reconstruct the backend path
    const path = `/${pathSegments.join("/")}`;
    const searchParams = req.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";
    const backendUrl = `${BACKEND_URL}${path}${queryString}`;

    // Prepare headers for backend request
    const backendHeaders: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Centralized authentication: Only use backend OAuth token (auth-token cookie)
    // This is set by the backend OAuth flow when user signs in via Passport
    // IMPORTANT: Don't verify this token - it was signed by the backend with JWT_SECRET
    // The backend will verify it. We just pass it through.
    const authTokenCookie = req.cookies.get("auth-token")?.value;
    let tokenSource = "none";

    // Log all cookies for debugging
    const allCookies = req.cookies.getAll();
    console.log(
      `[proxy] All cookies:`,
      allCookies.map((c) => c.name)
    );

    // Only use backend OAuth token - no NextAuth fallback
    if (authTokenCookie) {
      // Backend OAuth sets auth-token cookie - use it directly
      tokenSource = "auth-token-cookie";
      console.log(`[proxy] ✅ Found auth-token cookie from backend OAuth`);
      console.log(
        `[proxy] ✅ Using auth-token cookie (backend will verify with JWT_SECRET)`
      );
    } else {
      // No token - proceed without auth (backend will handle it with optionalAuth for public endpoints)
      if (!isForecastEndpoint) {
        console.log(
          `[proxy] ⚠️ No auth-token cookie found - proceeding without auth`
        );
      } else {
        console.log(
          `[proxy] Forecast endpoint without auth-token - proceeding without auth (backend uses optionalAuth)`
        );
      }
    }

    console.log(
      `[proxy] JWT token from ${tokenSource}:`,
      !!authTokenCookie,
      authTokenCookie ? "raw token (backend will verify)" : "null"
    );

    // Add Authorization header if we have the backend OAuth token
    // Only use backend OAuth token - no NextAuth fallback
    if (authTokenCookie) {
      // Use the backend OAuth cookie directly (don't verify - backend will verify with JWT_SECRET)
      backendHeaders.Authorization = `Bearer ${authTokenCookie}`;
      console.log(
        `[proxy] 🔐 Using auth-token cookie directly (backend will verify with JWT_SECRET)`
      );
    } else {
      // No token - proceed without auth (backend will handle with optionalAuth for public endpoints)
      if (!isForecastEndpoint) {
        console.log(
          `[proxy] ⚠️ No auth-token cookie found for ${path} - proceeding without auth`
        );
      } else {
        console.log(
          `[proxy] Forecast endpoint without auth-token - proceeding without auth (backend uses optionalAuth)`
        );
      }
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
