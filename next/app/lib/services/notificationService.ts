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

    // Create AlertNotification record BEFORE sending to prevent duplicates
    // This ensures duplicate prevention works for all notification methods
    const alertNotification = await prisma.alertNotification.create({
      data: {
        alertId: alert.id,
        alertName: alertMatch.alertName,
        region: alertMatch.region,
        beachId: logEntry?.beachId ?? null,
        beachName: resolvedBeachName,
        success: false, // Will update to true after successful send
        details: message,
        // For app notifications, also create the Notification record
        ...(alert.notificationMethod === "app" && {
          notifications: {
            create: {
              userId: alert.userId,
              type: "ALERT",
              title: `${alertMatch.alertName} - Conditions Match!`,
              message: message,
              read: false,
            },
          },
        }),
      },
    });

    // Send notification based on user preference
    let sendSuccess = false;
    try {
      switch (alert.notificationMethod as NotificationMethod) {
        case "email":
          const { sendEmail } = await import("@/app/lib/email");
          sendSuccess = await sendEmail(
            alert.contactInfo,
            alertMatch.alertName,
            message
          );
          break;
        case "whatsapp":
          // Try Unipile first (simplest, QR code connection, no business email needed)
          if (process.env.UNIPILE_API_KEY) {
            const { sendWhatsAppMessageUnipile } = await import(
              "@/app/lib/whatsapp-simple"
            );
            sendSuccess = await sendWhatsAppMessageUnipile(
              alert.contactInfo,
              message
            );
          }
          // Fallback to WaSenderAPI
          else if (process.env.WASENDERAPI_TOKEN) {
            const { sendWhatsAppMessage } = await import(
              "@/app/lib/whatsapp-simple"
            );
            sendSuccess = await sendWhatsAppMessage(alert.contactInfo, message);
          }
          // Fallback to MessageBird if others not configured
          else if (process.env.MESSAGEBIRD_API_KEY) {
            const { sendWhatsAppMessage } = await import(
              "@/app/lib/messagebird"
            );
            sendSuccess = await sendWhatsAppMessage(alert.contactInfo, message);
          } else {
            console.error(
              "No WhatsApp provider configured. Set UNIPILE_API_KEY, WASENDERAPI_TOKEN, or MESSAGEBIRD_API_KEY"
            );
            sendSuccess = false;
          }
          break;
        case "app":
          // Notification record already created above
          sendSuccess = true;
          break;
        case "both":
          const { sendEmail: sendEmailBoth } = await import("@/app/lib/email");

          // Try Unipile first, then WaSenderAPI, then MessageBird
          let whatsappSuccess = false;
          if (process.env.UNIPILE_API_KEY) {
            const { sendWhatsAppMessageUnipile } = await import(
              "@/app/lib/whatsapp-simple"
            );
            whatsappSuccess = await sendWhatsAppMessageUnipile(
              alert.contactInfo,
              message
            );
          } else if (process.env.WASENDERAPI_TOKEN) {
            const { sendWhatsAppMessage: sendWhatsAppBoth } = await import(
              "@/app/lib/whatsapp-simple"
            );
            whatsappSuccess = await sendWhatsAppBoth(
              alert.contactInfo,
              message
            );
          } else if (process.env.MESSAGEBIRD_API_KEY) {
            const { sendWhatsAppMessage: sendWhatsAppBoth } = await import(
              "@/app/lib/messagebird"
            );
            whatsappSuccess = await sendWhatsAppBoth(
              alert.contactInfo,
              message
            );
          }

          const emailSuccess = await sendEmailBoth(
            alert.contactInfo,
            alertMatch.alertName,
            message
          );
          sendSuccess = emailSuccess || whatsappSuccess; // Success if either works
          break;
        default:
          throw new Error(
            `Unknown notification method: ${alert.notificationMethod}`
          );
      }

      // Update notification record with success status
      await prisma.alertNotification.update({
        where: { id: alertNotification.id },
        data: { success: sendSuccess },
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      // Update notification record with failure
      await prisma.alertNotification.update({
        where: { id: alertNotification.id },
        data: {
          success: false,
          details: `Failed to send: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      });
      throw error;
    }

    // Record this check in the database
    await prisma.alertCheck.create({
      data: {
        alertId: alert.id,
        success: sendSuccess,
        details: `Notification sent via ${alert.notificationMethod}`,
      },
    });

    return sendSuccess;
  } catch (error) {
    console.error("Error sending alert notification:", error);
    return false;
  }
}

function createNotificationMessage(alertMatch: AlertMatch, beachName: string) {
  // Format property names for display
  const formatPropertyName = (property: string): string => {
    const propertyMap: Record<string, string> = {
      starRating: "Star Rating",
      windSpeed: "Wind Speed",
      windDirection: "Wind Direction",
      swellHeight: "Swell Height",
      swellPeriod: "Swell Period",
      swellDirection: "Swell Direction",
      waveHeight: "Wave Height",
      temperature: "Temperature",
    };
    return propertyMap[property] || property;
  };

  // Format property values for display
  const formatPropertyValue = (
    property: string,
    value: string | number
  ): string => {
    if (property === "starRating") {
      const rating =
        typeof value === "number" ? value : parseInt(value.toString());
      return `${rating} ${rating === 1 ? "star" : "stars"}`;
    }
    return value.toString();
  };

  // Build details from matchedProperties
  const details = alertMatch.matchedProperties
    .filter((p) => p.withinRange)
    .map((p) => {
      const propertyName = formatPropertyName(p.property);
      const currentValue = formatPropertyValue(p.property, p.forecastValue);
      const requiredValue = formatPropertyValue(p.property, p.logValue);

      if (p.property === "starRating") {
        return `${propertyName}: ${currentValue} (minimum required: ${requiredValue})`;
      }
      return `${propertyName}: ${currentValue} (target: ${requiredValue})`;
    })
    .join(", ");

  return `Surf conditions at ${beachName} have met your alert criteria: ${details}`;
}
