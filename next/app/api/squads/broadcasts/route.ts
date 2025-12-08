import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/app/lib/api-config";

const BACKEND_URL = getBackendUrl();

/**
 * POST /api/squads/broadcasts
 * Create and send a broadcast
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/squads/broadcasts`, {
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
        { error: "Failed to create broadcast", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[broadcasts-proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to create broadcast" },
      { status: 500 }
    );
  }
}
