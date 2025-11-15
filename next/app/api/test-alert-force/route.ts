import { NextResponse } from "next/server";
import { sendAlertNotification } from "@/app/lib/services/notificationService";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { AlertMatch } from "@/app/lib/services/alertProcessor";

/**
 * Test endpoint to force trigger an alert notification
 * This bypasses condition checking and directly sends a test notification
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

    // Get alert ID from query params, or use the first alert
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("alertId");

    // Get user's alerts
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
        properties: true,
      },
    });

    if (userAlerts.length === 0) {
      return NextResponse.json({
        error: "No active alerts found. Please create an alert first.",
      });
    }

    // Find the alert to test
    const alertToTest = alertId
      ? userAlerts.find((a) => a.id === alertId)
      : userAlerts[0];

    if (!alertToTest) {
      return NextResponse.json({
        error: `Alert with ID ${alertId} not found`,
        availableAlerts: userAlerts.map((a) => ({ id: a.id, name: a.name })),
      });
    }

    console.log("🧪 Force testing alert:", alertToTest.id, alertToTest.name);

    // Create a mock match to force trigger the notification
    const mockMatch: AlertMatch = {
      alertId: alertToTest.id,
      alertName: alertToTest.name,
      region: alertToTest.regionId,
      timestamp: new Date(),
      matchedProperties: alertToTest.properties?.map((prop: any) => ({
        property: prop.property,
        logValue: prop.optimalValue,
        forecastValue: prop.optimalValue, // Match exactly for testing
        difference: 0,
        withinRange: true,
      })) || [
        {
          property: "swellHeight",
          logValue: 1.5,
          forecastValue: 1.5,
          difference: 0,
          withinRange: true,
        },
      ],
      matchDetails: "Test alert - conditions match (forced for testing)",
    };

    // Get beach name
    const beachName =
      alertToTest.logEntry?.beach?.name ||
      alertToTest.logEntry?.beachName ||
      "Test Beach";

    // For testing, delete any existing notifications from today so we can test again
    await prisma.alertNotification.deleteMany({
      where: {
        alertId: alertToTest.id,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(24, 0, 0, 0)),
        },
      },
    });

    // Send the notification
    console.log("📧 Sending test notification to:", alertToTest.contactInfo);
    const success = await sendAlertNotification(
      mockMatch,
      alertToTest,
      beachName
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Test alert notification sent successfully!",
        alert: {
          id: alertToTest.id,
          name: alertToTest.name,
          notificationMethod: alertToTest.notificationMethod,
          contactInfo: alertToTest.contactInfo,
          beachName: beachName,
        },
        note: `Check ${alertToTest.contactInfo} for the test email`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send notification",
          alert: {
            id: alertToTest.id,
            name: alertToTest.name,
          },
        },
        { status: 500 }
      );
    }
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
