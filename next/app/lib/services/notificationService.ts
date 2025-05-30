import { Alert } from "@prisma/client";
import { AlertMatch } from "./alertProcessor";
import { prisma } from "@/app/lib/prisma";
import { NotificationMethod } from "@/app/types/alerts";

export async function sendAlertNotification(
  alertMatch: AlertMatch,
  alert: Alert,
  beachName: string = "Unknown location"
): Promise<boolean> {
  try {
    // Get the associated LogEntry's beach information if it exists
    const logEntry = alert.logEntryId
      ? await prisma.logEntry.findUnique({
          where: { id: alert.logEntryId },
          select: {
            beachId: true,
            beachName: true, // Also get the beach name from LogEntry
            beach: {
              // Get beach info as fallback
              select: {
                name: true,
              },
            },
          },
        })
      : null;

    // Use the beach name from LogEntry, or from the beach relation, or fallback to parameter
    const resolvedBeachName =
      logEntry?.beachName || logEntry?.beach?.name || beachName;

    // Check for existing notification first
    const existingNotification = await prisma.alertNotification.findFirst({
      where: {
        alertId: alert.id,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
          lt: new Date(new Date().setHours(24, 0, 0, 0)),
        },
      },
    });

    if (existingNotification) {
      console.log("Notification already sent today, skipping");
      return true;
    }

    // Prepare notification message
    const message = createNotificationMessage(alertMatch, resolvedBeachName);

    // Send notification based on user preference
    switch (alert.notificationMethod as NotificationMethod) {
      case "email":
        const { sendEmail } = await import("@/app/lib/email");
        await sendEmail(alert.contactInfo, alertMatch.alertName, message);
        break;
      case "whatsapp":
        const { sendWhatsAppMessage } = await import("@/app/lib/messagebird");
        await sendWhatsAppMessage(alert.contactInfo, message);
        break;
      case "app":
        // First create the AlertNotification record
        const alertNotification = await prisma.alertNotification.create({
          data: {
            alertId: alert.id,
            alertName: alertMatch.alertName,
            region: alertMatch.region,
            beachId: logEntry?.beachId ?? null,
            beachName: resolvedBeachName, // Use the resolved beach name
            success: true,
            details: message,
            // Create the associated Notification record in the same transaction
            notifications: {
              create: {
                userId: alert.userId,
                type: "ALERT",
                title: `${alertMatch.alertName} - Conditions Match!`,
                message: message,
                read: false,
              },
            },
          },
          include: {
            notifications: true,
          },
        });
        break;
      default:
        throw new Error(
          `Unknown notification method: ${alert.notificationMethod}`
        );
    }

    // Record this check in the database
    await prisma.alertCheck.create({
      data: {
        alertId: alert.id,
        success: true,
        details: `Notification sent via ${alert.notificationMethod}`,
      },
    });

    return true;
  } catch (error) {
    console.error("Error sending alert notification:", error);
    return false;
  }
}

function createNotificationMessage(alertMatch: AlertMatch, beachName: string) {
  // Build details from matchedProperties
  const details = alertMatch.matchedProperties
    .filter((p) => p.withinRange)
    .map((p) => `${p.property}: ${p.forecastValue} (vs ${p.logValue})`)
    .join(", ");

  return `Conditions at ${beachName} match: ${details}`;
}
