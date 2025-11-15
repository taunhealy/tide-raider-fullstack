import { processUserAlerts } from "@/app/lib/services/alertProcessor";
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

// Increase timeout for processing multiple users (5 minutes)
export const maxDuration = 300;

// This endpoint will be triggered by a cron job every 6 hours
export async function GET() {
  try {
    console.log("🔄 Starting daily alert check process");

    // Get today's date (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get all users with active alerts
    const usersWithAlerts = await prisma.user.findMany({
      where: {
        alerts: {
          some: {
            active: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    console.log(`👥 Found ${usersWithAlerts.length} users with active alerts`);

    // 2. Process alerts for each user
    const results = {
      usersProcessed: 0,
      alertsChecked: 0,
      notificationsSent: 0,
      errors: 0,
    };

    for (const user of usersWithAlerts) {
      try {
        console.log(`👤 Processing alerts for user: ${user.id}`);

        // Process all alerts for this user
        const userResult = await processUserAlerts(user.id, today);

        // Update overall results
        results.usersProcessed++;
        results.alertsChecked += userResult.alertsChecked;
        results.notificationsSent += userResult.notificationsSent;
        results.errors += userResult.errors;
      } catch (error) {
        console.error(`❌ Error processing alerts for user ${user.id}:`, error);
        results.errors++;
      }
    }

    console.log("✅ Daily alert check completed", results);

    return NextResponse.json({
      success: true,
      message: "Daily alert check completed",
      results,
    });
  } catch (error) {
    console.error("❌ Error in daily alert check:", error);
    return NextResponse.json(
      { error: "Failed to process daily alerts" },
      { status: 500 }
    );
  }
}
