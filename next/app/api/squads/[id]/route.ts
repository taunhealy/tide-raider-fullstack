import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/app/lib/api-config";

const BACKEND_URL = getBackendUrl();

/**
 * GET /api/squads/[id]
 * Get a specific squad
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    const response = await fetch(`${BACKEND_URL}/api/squads/${params.id}`, {
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to fetch squad", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[squads-proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch squad" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/squads/[id]
 * Update a squad
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/squads/${params.id}`, {
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
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to update squad", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[squads-proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to update squad" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/squads/[id]
 * Delete a squad
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    const response = await fetch(`${BACKEND_URL}/api/squads/${params.id}`, {
      method: "DELETE",
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to delete squad", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[squads-proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete squad" },
      { status: 500 }
    );
  }
}



