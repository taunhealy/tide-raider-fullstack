import { NextRequest, NextResponse } from "next/server";

// Use NEXT_PUBLIC_API_URL if set, otherwise use environment-appropriate default
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDevelopment = process.env.NODE_ENV === "development";

  // In development, use localhost backend (connects to Docker postgres)
  if (isDevelopment) {
    return envUrl || "http://localhost:4001";
  }

  // In production, use production backend (connects to Fly.io postgres)
  return envUrl || "https://tide-raider-backend.fly.dev";
};

const BACKEND_URL = getBackendUrl();

/**
 * GET /api/backend-health
 * Quick health check to see if backend is running
 */
export async function GET(req: NextRequest) {
  try {
    // Quick timeout for health check (2 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          available: true,
          backendUrl: BACKEND_URL,
          status: data.status,
          timestamp: data.timestamp,
        });
      }

      return NextResponse.json({
        available: false,
        backendUrl: BACKEND_URL,
        error: `Backend returned status ${response.status}`,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);

      const isConnectionError =
        error.name === "AbortError" ||
        error.code === "ECONNREFUSED" ||
        (error.cause && error.cause.code === "ECONNREFUSED") ||
        error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("fetch failed");

      return NextResponse.json({
        available: false,
        backendUrl: BACKEND_URL,
        error: isConnectionError
          ? "Backend server is not running or not reachable"
          : error.message || "Unknown error",
        isConnectionError,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        available: false,
        backendUrl: BACKEND_URL,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

