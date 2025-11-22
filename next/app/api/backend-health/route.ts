import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/app/lib/api-config";

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

