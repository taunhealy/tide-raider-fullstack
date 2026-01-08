import { prisma } from "../lib/prisma";
import { AlertMatch } from "./alertProcessor";

type NotificationMethod = "email" | "whatsapp" | "app" | "both";

// Helper function to create plain text message for WhatsApp/other text methods
export function getPlainTextMessage(
  alertMatch: AlertMatch,
  beachName: string,
  regionName: string,
  forecastDate: Date
): string {
  const date = new Date(forecastDate);
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const dateString = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
    if (property === "windSpeed" || property === "swellHeight") {
      return `${value}`;
    }
    if (property === "windDirection" || property === "swellDirection") {
      return `${value}°`;
    }
    if (property === "swellPeriod") {
      return `${value}s`;
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

  return `🌊 Alert Triggered!

📍 Location Details:
• Beach: ${beachName}
• Region: ${regionName}
• Day: ${dayName}
• Date: ${dateString}

✅ Conditions Met:
Surf conditions at ${beachName} have met your alert criteria: ${details}

---
Tide Raider - https://www.tideraider.com`;
}

interface Alert {
  id: string;
  name: string;
  userId: string;
  alertType: string;
  notificationMethod: string;
  contactInfo: string;
  logEntryId?: string | null;
  beachId?: string | null;
  starRating?: number | null;
  logEntry?: any;
  beach?: any;
  sources?: string[];
}

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
            beachName: true,
            date: true,
            beach: {
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

    // Get region information
    const region = await prisma.region.findUnique({
      where: { id: alertMatch.region },
      select: {
        name: true,
      },
    });
    const regionName = region?.name || alertMatch.region;

    // Get the forecast date from the alert or log entry
    const alertRecord = await prisma.alert.findUnique({
      where: { id: alert.id },
      select: {
        forecastDate: true,
      },
    });
    const forecastDate =
      alertRecord?.forecastDate || logEntry?.date || new Date();

    // Check for existing notification first
    const existingNotification = await prisma.alertNotification.findFirst({
      where: {
        alertId: alert.id,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
          lt: new Date(new Date().setHours(24, 0, 0, 0)),
        },
        success: true,
      },
    });

    if (existingNotification) {
      console.log("Notification already sent today (successfully), skipping");
      return true;
    }

    // Prepare notification message with all details
    const message = createNotificationMessage(
      alertMatch,
      resolvedBeachName,
      regionName,
      forecastDate,
      alert.sources || []
    );

    // Create AlertNotification record BEFORE sending to prevent duplicates
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
              message: getPlainTextMessage(
                alertMatch,
                resolvedBeachName,
                regionName,
                forecastDate
              ),
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
          const { sendEmail } = await import("../lib/email");
          console.log(`📧 Sending email notification for alert ${alert.id}:`, {
            to: alert.contactInfo,
            subject: alertMatch.alertName,
            alertName: alert.name,
          });
          sendSuccess = await sendEmail(
            alert.contactInfo,
            alertMatch.alertName,
            message
          );
          console.log(
            `📧 Email send result for alert ${alert.id}: ${sendSuccess ? "SUCCESS" : "FAILED"}`
          );
          break;
        case "whatsapp":
          // Use plain text for WhatsApp
          const plainTextMsg = getPlainTextMessage(
            alertMatch,
            resolvedBeachName,
            regionName,
            forecastDate
          );
          // Try Unipile first
          if (process.env.UNIPILE_API_KEY) {
            const { sendWhatsAppMessageUnipile } = await import(
              "../lib/whatsapp"
            );
            sendSuccess = await sendWhatsAppMessageUnipile(
              alert.contactInfo,
              plainTextMsg
            );
          }
          // Fallback to WaSenderAPI
          else if (process.env.WASENDERAPI_TOKEN) {
            const { sendWhatsAppMessage } = await import("../lib/whatsapp");
            sendSuccess = await sendWhatsAppMessage(
              alert.contactInfo,
              plainTextMsg
            );
          }
          // Fallback to MessageBird
          else if (process.env.MESSAGEBIRD_API_KEY) {
            const { sendWhatsAppMessage } = await import("../lib/messagebird");
            sendSuccess = await sendWhatsAppMessage(
              alert.contactInfo,
              plainTextMsg
            );
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
          const { sendEmail: sendEmailBoth } = await import("../lib/email");
          const plainTextMsgBoth = getPlainTextMessage(
            alertMatch,
            resolvedBeachName,
            regionName,
            forecastDate
          );

          // Try Unipile first, then WaSenderAPI, then MessageBird
          let whatsappSuccess = false;
          if (process.env.UNIPILE_API_KEY) {
            const { sendWhatsAppMessageUnipile } = await import(
              "../lib/whatsapp"
            );
            whatsappSuccess = await sendWhatsAppMessageUnipile(
              alert.contactInfo,
              plainTextMsgBoth
            );
          } else if (process.env.WASENDERAPI_TOKEN) {
            const { sendWhatsAppMessage: sendWhatsAppBoth } = await import(
              "../lib/whatsapp"
            );
            whatsappSuccess = await sendWhatsAppBoth(
              alert.contactInfo,
              plainTextMsgBoth
            );
          } else if (process.env.MESSAGEBIRD_API_KEY) {
            const { sendWhatsAppMessage: sendWhatsAppBoth } = await import(
              "../lib/messagebird"
            );
            whatsappSuccess = await sendWhatsAppBoth(
              alert.contactInfo,
              plainTextMsgBoth
            );
          }

          console.log(
            `📧 Sending email notification (both method) for alert ${alert.id}:`,
            {
              to: alert.contactInfo,
              subject: alertMatch.alertName,
              alertName: alert.name,
            }
          );
          const emailSuccess = await sendEmailBoth(
            alert.contactInfo,
            alertMatch.alertName,
            message
          );
          console.log(
            `📧 Email send result (both method) for alert ${alert.id}: ${emailSuccess ? "SUCCESS" : "FAILED"}`
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

function createNotificationMessage(
  alertMatch: AlertMatch,
  beachName: string,
  regionName: string,
  forecastDate: Date,
  alertSources: string[] = []
) {
  // Format the date
  const date = new Date(forecastDate);
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const dateString = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
    if (property === "windSpeed" || property === "swellHeight") {
      return `${value}`;
    }
    if (property === "windDirection" || property === "swellDirection") {
      return `${value}°`;
    }
    if (property === "swellPeriod") {
      return `${value}s`;
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

  // Create HTML email template matching Tide Raider design system
  const htmlMessage = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          line-height: 1.5;
          color: #1a1a1a;
          background-color: #ffffff;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background-color: #ffffff;
          padding: 32px 24px 24px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .header-logo {
          font-size: 20px;
          font-weight: 600;
          color: #000000;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .header-title {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
          margin-top: 16px;
          line-height: 1.2;
        }
        .content {
          background-color: #f7f7f7;
          padding: 24px;
        }
        .info-section {
          background-color: #ffffff;
          padding: 20px;
          margin-bottom: 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .info-section h2 {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 16px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 12px;
        }
        .info-row {
          display: flex;
          margin: 12px 0;
          padding-bottom: 12px;
          border-bottom: 1px solid #f7f7f7;
        }
        .info-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }
        .info-label {
          font-weight: 400;
          min-width: 100px;
          color: #4b5563;
          font-size: 14px;
        }
        .info-value {
          color: #1a1a1a;
          font-weight: 500;
          font-size: 14px;
        }
        .conditions {
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          border-left: 4px solid #1cd9ff;
          margin-top: 16px;
        }
        .conditions h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 12px 0;
        }
        .conditions p {
          font-size: 14px;
          color: #1a1a1a;
          line-height: 1.6;
          margin: 8px 0;
        }
        .conditions strong {
          color: #1a1a1a;
          font-weight: 600;
        }
        .footer {
          background-color: #ffffff;
          text-align: center;
          padding: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          font-size: 12px;
          color: #4b5563;
          margin: 4px 0;
          line-height: 1.5;
        }
        .footer a {
          color: #1cd9ff;
          text-decoration: none;
          font-weight: 500;
        }
        .footer a:hover {
          text-decoration: underline;
        }
        .divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 24px 0;
        }
        @media only screen and (max-width: 600px) {
          .email-container {
            width: 100% !important;
          }
          .content {
            padding: 16px !important;
          }
          .info-section, .conditions {
            padding: 16px !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="header-logo">Tide Raider</div>
          <div class="header-title">🌊 Alert Triggered!</div>
        </div>
        <div class="content">
          <div class="info-section">
            <h2>Location Details</h2>
            <div class="info-row">
              <span class="info-label">Beach:</span>
              <span class="info-value">${beachName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Region:</span>
              <span class="info-value">${regionName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Day:</span>
              <span class="info-value">${dayName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span class="info-value">${dateString}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Alert Sources:</span>
              <span class="info-value">${alertSources.length > 0 ? alertSources.join(", ") : "All Sources"}</span>
            </div>
          </div>
          
          <div class="conditions">
            <h3>✅ Conditions Met</h3>
            <p>Surf conditions at <strong>${beachName}</strong> have met your alert criteria:</p>
            <p><strong>${details}</strong></p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated alert from Tide Raider</p>
          <p>Visit <a href="https://www.tideraider.com">tideraider.com</a> to manage your alerts</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Plain text version for non-HTML clients
  const plainTextMessage = `
🌊 Alert Triggered!

Location Details:
- Beach: ${beachName}
- Region: ${regionName}
- Day: ${dayName}
- Date: ${dateString}
- Alert Sources: ${alertSources.length > 0 ? alertSources.join(", ") : "All Sources"}

✅ Conditions Met:
Surf conditions at ${beachName} have met your alert criteria: ${details}

---
This is an automated alert from Tide Raider
Visit https://www.tideraider.com to manage your alerts
  `.trim();

  // Return HTML for email, plain text for other methods
  // For WhatsApp and other text-based methods, we'll need to extract plain text
  return htmlMessage;
}
