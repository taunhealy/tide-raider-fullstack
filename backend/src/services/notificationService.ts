import { prisma } from "../lib/prisma";
import { AlertMatch } from "./alertProcessor";

type NotificationMethod = "email" | "whatsapp" | "app" | "both";

// Helper function to create plain text message for WhatsApp/other text methods
export function getPlainTextMessage(
  alertMatch: AlertMatch,
  beachName: string,
  regionName: string,
  forecastDate: Date,
  alertSources: string[] = []
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

  // Map source names to tactical aliases
  const mapSourceToAlias = (sources: string[]): string => {
    if (sources.length === 0) return "Global Intelligence";
    return sources.map(s => {
      const source = s.toUpperCase();
      if (source === "WINDFINDER") return "Windfinder";
      if (source === "WINDGURU" || source === "WINDGURU_G2") return "Windguru";
      if (source === "WINDY" || source === "WINDY_COM") return "Windy";
      if (source === "OPENMETEO_ARCHIVE") return "Archive Data";
      return s;
    }).join(", ");
  };

  // Build details from all slots
  const slotsDetails = alertMatch.slots.map(slotData => {
    const slotTitle = slotData.slot.charAt(0).toUpperCase() + slotData.slot.slice(1).toLowerCase();
    const details = slotData.matchedProperties
      .filter((p) => p.withinRange)
      .map((p) => {
        const propertyName = formatPropertyName(p.property);
        const currentValue = formatPropertyValue(p.property, p.forecastValue);
        const requiredValue = formatPropertyValue(p.property, p.logValue);

        return `  • ${propertyName}: ${currentValue} (target: ${requiredValue})`;
      })
      .join("\n");
    
    return `*${slotTitle}*\n${details}`;
  }).join("\n\n");

  return `*Tide Raider*
🌊 *Alert Triggered!*

*Location Details*
Beach:
${beachName}

Region:
${regionName}

Day:
${dayName}

Date:
${dateString}

Alert Sources:
${mapSourceToAlias(alertSources)}

*✅ Conditions Met*
Surf conditions at ${beachName} have met your alert criteria for the following slots:

${slotsDetails}

---
*Tide Raider Intelligence*
🛰️ https://www.tideraider.com`;
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
  user?: {
    email: string;
  };
}

export async function sendAlertNotification(
  alertMatch: AlertMatch,
  alert: Alert,
  beachName: string = "Unknown location",
  matchDate?: Date | string | number
): Promise<boolean> {
  try {
    // Ensure matchDate is a valid Date object
    let displayDate: Date;
    if (matchDate) {
      displayDate = new Date(matchDate);
      if (isNaN(displayDate.getTime())) {
        displayDate = new Date();
      }
    } else {
      displayDate = new Date();
    }
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

    // The date shown in the notification should be the date of the match (today/tomorrow/etc)
    // rather than the original alert creation date or any other historical date.
    // We explicitly use displayDate which is derived from matchDate.
    
    // Format date string for deduplication check (e.g., "May 10, 2026")
    const dateString = displayDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Safety check: Don't send notifications for dates in the past
    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);
    if (displayDate < todayMidnight) {
      console.log(`[Notification] ⏭️ Skipping notification for past date: ${dateString} (Today is ${todayMidnight.toISOString().split('T')[0]})`);
      return true; // Skip
    }

    // Check for existing notification for THIS alert AND THIS target date TODAY
    // This prevents multiple alerts for the same beach/date being sent in a single day
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const existingNotification = await prisma.alertNotification.findFirst({
      where: {
        alertId: alert.id,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        details: {
          contains: dateString,
        },
        success: true, 
      },
    });

    if (existingNotification) {
      console.log(`[Notification] ⏭️ Already sent alert for ${dateString} today, skipping.`);
      return true;
    }

    // Prepare notification message with all details
    const message = createNotificationMessage(
      alertMatch,
      resolvedBeachName,
      regionName,
      displayDate,
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
                displayDate
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
            displayDate,
            alert.sources || []
          );
          
          const { sendWhatsAppBoth } = await import("../lib/whatsapp");
          sendSuccess = await sendWhatsAppBoth(alert.contactInfo, plainTextMsg);
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
            displayDate,
            alert.sources || []
          );

          const { sendWhatsAppBoth: sendWhatsAppBothShared } = await import(
            "../lib/whatsapp"
          );
          let whatsappSuccess = await sendWhatsAppBothShared(
            alert.contactInfo,
            plainTextMsgBoth
          );

          console.log(
            `📧 Sending email notification (both method) for alert ${alert.id}:`,
            {
              to: alert.user?.email || "Unknown Email",
              subject: alertMatch.alertName,
              alertName: alert.name,
            }
          );
          const emailSuccess = alert.user?.email 
            ? await sendEmailBoth(
                alert.user.email,
                alertMatch.alertName,
                message
              )
            : false;
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
  const date = new Date(forecastDate);
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const dateString = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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

  const formatPropertyValue = (property: string, value: string | number): string => {
    if (property === "starRating") return `${value} stars`;
    if (property === "windSpeed" || property === "swellHeight") return `${value}`;
    if (property === "windDirection" || property === "swellDirection") return `${value}°`;
    if (property === "swellPeriod") return `${value}s`;
    return value.toString();
  };

  const mapSourceToAlias = (sources: string[]): string => {
    if (sources.length === 0) return "Global Intelligence";
    return sources.map(s => {
      const source = s.toUpperCase();
      if (source === "WINDFINDER") return "Source A";
      if (source === "MSW" || source === "MAGICSEAWEED") return "Source B";
      if (source === "SURFLINE") return "Source C";
      return s;
    }).join(", ");
  };

  const slotsDetails = alertMatch.slots.map(slotData => {
    const slotTitle = slotData.slot.charAt(0).toUpperCase() + slotData.slot.slice(1).toLowerCase();
    const details = slotData.matchedProperties
      .filter((p) => p.withinRange)
      .map((p) => {
        const propertyName = formatPropertyName(p.property);
        const currentValue = formatPropertyValue(p.property, p.forecastValue);
        const requiredValue = formatPropertyValue(p.property, p.logValue);
        return `• ${propertyName}: ${currentValue} (target: ${requiredValue})`;
      })
      .join("<br>");
    
    return `
      <div style="margin-top: 16px;">
        <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${slotTitle}</div>
        <div style="font-size: 13px; color: #334155; line-height: 1.6; padding-left: 12px; border-left: 2px solid #e2e8f0;">${details}</div>
      </div>
    `;
  }).join("");

  const htmlMessage = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; color: #1e293b; background: #f8fafc; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { padding: 32px; border-bottom: 1px solid #f1f5f9; }
        .brand { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 8px; }
        .title { font-size: 24px; font-weight: 800; color: #0f172a; }
        .content { padding: 32px; background: #fcfdfe; }
        .section-label { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin: 24px 0 8px; }
        .data-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
        .data-value { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
        .conditions { background: #f8fafc; padding: 20px; border-radius: 16px; border-left: 4px solid #0ea5e9; margin-top: 24px; }
        .footer { padding: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">Tide Raider</div>
          <div class="title">🌊 Alert Triggered!</div>
        </div>
        <div class="content">
          <div class="section-label">Location Details</div>
          <div class="data-label">Beach:</div><div class="data-value">${beachName}</div>
          <div class="data-label">Region:</div><div class="data-value">${regionName}</div>
          <div class="data-label">Day:</div><div class="data-value">${dayName}</div>
          <div class="data-label">Date:</div><div class="data-value">${dateString}</div>
          <div class="data-label">Alert Sources:</div><div class="data-value">${mapSourceToAlias(alertSources)}</div>
          
          <div class="conditions">
            <div class="section-label" style="margin-top: 0; color: #0ea5e9;">✅ Conditions Met</div>
            <p style="font-size: 14px; margin-bottom: 4px;">Surf conditions at <strong>${beachName}</strong> have met your criteria for the following slots:</p>
            ${slotsDetails}
          </div>
        </div>
        <div class="footer">
          Tide Raider Intelligence • 🛰️ https://www.tideraider.com
        </div>
      </div>
    </body>
    </html>
  `;

  return htmlMessage;
}
