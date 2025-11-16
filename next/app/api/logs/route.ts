import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Proxy to backend /api/logs
 * The backend handles all log entry CRUD operations
 */
export async function GET(req: NextRequest) {
  try {
    const queryString = req.nextUrl.searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/logs${queryString ? `?${queryString}` : ""}`;

    console.log(`[logs] Proxying GET to backend: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Forward authorization header if present
        ...(req.headers.get("authorization") && {
          Authorization: req.headers.get("authorization")!,
        }),
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
