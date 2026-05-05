import { NextRequest, NextResponse } from "next/server";

// Use NEXT_PUBLIC_API_URL if set, otherwise use environment-appropriate default
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDevelopment = process.env.NODE_ENV === "development";

  // In development, use localhost backend (connects to Docker postgres)
  if (isDevelopment) {
    return envUrl || "http://localhost:4050";
  }

  // In production, use production backend (connects to Fly.io postgres)
  return envUrl || "https://tide-raider-backend.fly.dev";
};

const BACKEND_URL = getBackendUrl();

/**
 * Proxy to backend /api/logs
 * The backend handles all log entry CRUD operations
 */
export async function GET(req: NextRequest) {
  try {
    const queryString = req.nextUrl.searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/logs${queryString ? `?${queryString}` : ""}`;

    console.log(`[logs] Proxying GET to backend: ${backendUrl}`);

    // Get auth token from cookies
    const cookieHeader = req.headers.get("cookie") || "";
    
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Forward authorization header if present
        ...(req.headers.get("authorization") && {
          Authorization: req.headers.get("authorization")!,
        }),
        // Forward cookies for auth
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
      credentials: "include", // Include cookies for auth
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || "Failed to fetch logs");
    }

    const data = await response.json();
    console.log(`[logs] Backend returned ${Array.isArray(data) ? data.length : 'non-array'} log entries`);
    if (process.env.NODE_ENV === "development" && Array.isArray(data) && data.length > 0) {
      console.log(`[logs] First log entry sample:`, {
        id: data[0].id,
        beachName: data[0].beach?.name || data[0].beachName,
        hasBeach: !!data[0].beach,
        hasForecast: !!data[0].forecast,
        hasRegion: !!data[0].region,
      });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("[logs] Backend error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const backendUrl = `${BACKEND_URL}/api/logs`;

    console.log(`[logs] Proxying POST to backend: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward authorization header if present
        ...(req.headers.get("authorization") && {
          Authorization: req.headers.get("authorization")!,
        }),
      },
      credentials: "include", // Include cookies for auth
      body,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || "Failed to create log");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[logs] Backend error:", error);
    return NextResponse.json(
      {
        error: "Failed to create log",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
