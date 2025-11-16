import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Test endpoint to force trigger an alert notification
 * Now calls backend API instead of using Prisma directly
 */
export async function GET(request: Request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in to test alerts" },
        { status: 401 }
      );
    }

    // Get alert ID from query params
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("alertId");

    // Call backend API to force test alert
    const backendUrl = `${BACKEND_URL}/api/alerts/test-force${alertId ? `?alertId=${alertId}` : ""}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Forward authorization if available
        ...(session.user && {
          Authorization: `Bearer ${session.user.id}`,
        }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || "Failed to test alert");
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ Error force testing alert:", error);
    return NextResponse.json(
      {
        error: "Failed to test alert",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
