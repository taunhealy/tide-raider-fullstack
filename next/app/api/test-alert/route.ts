import { NextResponse } from "next/server";
import { processUserAlerts } from "@/app/lib/services/alertProcessor";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

/**
 * Test endpoint to simulate alert checking for the current user
 * This will check all active alerts for the logged-in user
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

    // Get today's date (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get user's active alerts
    const userAlerts = await prisma.alert.findMany({
      where: {
        userId: session.user.id,
        active: true,
      },
      include: {
        logEntry: {
          include: {
            beach: true,
            forecast: true,
          },
        },
        beach: {
          select: { id: true, name: true },
        },
        properties: true,
      },
    });

    if (userAlerts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active alerts found for your account",
        alertsChecked: 0,
        notificationsSent: 0,
        alerts: [],
      });
    }

    console.log(`📋 Found ${userAlerts.length} active alerts to check`);

    // Log alert details for debugging
    userAlerts.forEach((alert) => {
      console.log(`📋 Alert: ${alert.name}`, {
        id: alert.id,
        alertType: alert.alertType,
        beachId: alert.beachId,
        beachName: alert.beach?.name,
        starRating: alert.starRating,
        regionId: alert.regionId,
      });
    });

    // Process alerts for this user
    const result = await processUserAlerts(session.user.id, today);

    // Check if beach scores exist for RATING alerts
    const ratingAlerts = userAlerts.filter(
      (a) => a.alertType === "RATING" && a.beachId
    );
    if (ratingAlerts.length > 0) {
      console.log(
        `🔍 Checking beach scores for ${ratingAlerts.length} RATING alerts...`
      );
      for (const alert of ratingAlerts) {
        if (!alert.beachId) continue; // Skip if no beachId

        const beachScore = await prisma.beachDailyScore.findFirst({
          where: {
            beachId: alert.beachId,
            date: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
          },
          select: {
            beachId: true,
            score: true,
            starRating: true,
            date: true,
          },
        });

        if (beachScore) {
          console.log(
            `✅ Found beach score for ${alert.beach?.name || alert.beachId}:`,
            beachScore
          );
        } else {
          console.log(
            `❌ No beach score found for ${alert.beach?.name || alert.beachId} (${alert.beachId}) today`
          );
        }
      }
    }

    // Get alert details for response
    const alertDetails = userAlerts.map((alert) => ({
      id: alert.id,
      name: alert.name,
      regionId: alert.regionId,
      notificationMethod: alert.notificationMethod,
      contactInfo: alert.contactInfo,
      alertType: alert.alertType,
      hasLogEntry: !!alert.logEntry,
      beachId: alert.beachId || alert.logEntry?.beach?.id || null,
      beachName:
        alert.beach?.name ||
        alert.logEntry?.beach?.name ||
        alert.logEntry?.beachName ||
        null,
      starRating: alert.starRating,
      propertiesCount: alert.properties?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      message: "Alert test completed",
      results: {
        alertsChecked: result.alertsChecked,
        notificationsSent: result.notificationsSent,
        errors: result.errors,
      },
      alerts: alertDetails,
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
