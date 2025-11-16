import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Test endpoint to simulate alert checking for the current user
 * Now calls backend API instead of using Prisma directly
 */
export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in to test alerts" },
        { status: 401 }
      );
    }

    console.log("🧪 Testing alert flow for user:", session.user.id);

    // Call backend API to process alerts
    const backendUrl = `${BACKEND_URL}/api/alerts/notify`;
    
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward authorization if available
        ...(session.user && {
          Authorization: `Bearer ${session.user.id}`, // Backend should handle auth properly
        }),
      },
      body: JSON.stringify({
        userId: session.user.id,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || "Failed to process alerts");
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Alert test completed",
      results: result.processed || {
        alertsChecked: 0,
        notificationsSent: 0,
        errors: 0,
      },
      note: "Check your email inbox for any notifications that were sent",
    });
  } catch (error) {
    console.error("❌ Error testing alerts:", error);
    return NextResponse.json(
      {
        error: "Failed to test alerts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
