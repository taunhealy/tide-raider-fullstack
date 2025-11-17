import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Use NEXT_PUBLIC_API_URL if set, otherwise default to production
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

/**
 * GET /api/raid-logs
 * Proxy to backend /api/raid-logs
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const searchParams = req.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";

    const response = await fetch(`${BACKEND_URL}/api/raid-logs${queryString}`, {
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
    });

    if (!response.ok) {
      // Handle 429 gracefully
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Too many requests, please try again later" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch logs" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching raid logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/raid-logs
 * Proxy to backend /api/raid-logs
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/api/raid-logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Try to get error message from backend
      const errorData = await response.json().catch(() => ({
        message: "Failed to create log",
      }));
      console.error("[raid-logs] Backend error:", errorData);
      return NextResponse.json(
        {
          error: errorData.message || errorData.error || "Failed to create log",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating raid log:", error);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/raid-logs
 * Proxy to backend /api/raid-logs
 */
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/api/raid-logs`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to update log" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating raid log:", error);
    return NextResponse.json(
      { error: "Failed to update log" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/raid-logs
 * Proxy to backend /api/raid-logs
 */
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const searchParams = req.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";

    const response = await fetch(`${BACKEND_URL}/api/raid-logs${queryString}`, {
      method: "DELETE",
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to delete log" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting raid log:", error);
    return NextResponse.json(
      { error: "Failed to delete log" },
      { status: 500 }
    );
  }
}
