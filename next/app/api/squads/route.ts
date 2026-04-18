import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/app/lib/api-config";

const BACKEND_URL = getBackendUrl();

/**
 * GET /api/squads
 * Get all squads for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    const response = await fetch(`${BACKEND_URL}/api/squads`, {
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to fetch squads", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[squads-proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch squads" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/squads
 * Create a new squad
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/squads`, {
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
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to create squad", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[squads-proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to create squad" },
      { status: 500 }
    );
  }
}
