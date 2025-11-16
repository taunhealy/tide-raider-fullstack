import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Proxy to backend /api/logs/:id
 * The backend handles all log entry operations
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const queryString = req.nextUrl.searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/logs/${id}${queryString ? `?${queryString}` : ""}`;

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
      throw new Error(error.error || "Failed to fetch log");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[logs] Backend error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch log",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
