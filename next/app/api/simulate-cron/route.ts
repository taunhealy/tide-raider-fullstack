import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * This is a utility endpoint to simulate the daily forecast alerts cron job
 * Now calls backend API instead of using Prisma directly
 */
export async function GET() {
  try {
    console.log("🔄 Simulating daily alert check process via backend");

    // Call backend cron endpoint
    const backendUrl = `${BACKEND_URL}/api/cron/fetch-and-alert`;
    
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": process.env.CRON_SECRET || "",
      },
      body: JSON.stringify({
        timezone: "UTC",
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
      message: "Daily alert check simulation completed",
      results: result.alertResults || {
        usersProcessed: 0,
        alertsChecked: 0,
        notificationsSent: 0,
        errors: 0,
      },
    });
  } catch (error) {
    console.error("❌ Error in daily alert check simulation:", error);
    return NextResponse.json(
      {
        error: "Failed to process daily alerts simulation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
