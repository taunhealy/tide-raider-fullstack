import { prisma } from "@/app/lib/prisma";
import { sendAlertNotification } from "./notificationService";
import { AlertType } from "@prisma/client";

// Move the AlertMatch interface here
export interface AlertMatch {
  alertId: string;
  alertName: string;
  region: string;
  timestamp: Date;
  matchedProperties: Array<{
    property: string;
    logValue: any;
    forecastValue: any;
    difference: number;
    withinRange: boolean;
  }>;
  matchDetails: string;
}

export async function processUserAlerts(userId: string, today: Date) {
  const result = {
    alertsChecked: 0,
    notificationsSent: 0,
    errors: 0,
  };

  try {
    // Get all active alerts for this user
    const userAlerts = await prisma.alert.findMany({
      where: {
        userId: userId,
        active: true,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        logEntry: {
          include: {
            forecast: true,
            beach: true,
          },
        },
        beach: {
          select: { id: true, name: true },
        },
        properties: true,
      },
    });

    // Get today's forecasts for all relevant regions
    const regions = [...new Set(userAlerts.map((alert) => alert.regionId))];
    const todaysForecasts = await prisma.forecastA.findMany({
      where: {
        regionId: { in: regions },
        date: {
          gte: new Date(new Date(today).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(today).setHours(23, 59, 59, 999)),
        },
      },
    });

    // Get beach IDs from alerts (both from logEntry and direct beachId)
    const beachIds = userAlerts
      .map((alert) => {
        const beachId = alert.logEntry?.beach?.id || alert.beachId;
        if (alert.alertType === AlertType.RATING && !beachId) {
          console.log(
            `[Alert Processor] WARNING: RATING alert ${alert.id} (${alert.name}) has no beachId!`
          );
        }
        return beachId;
      })
      .filter((id) => id !== undefined && id !== null) as string[];

    console.log(
      `[Alert Processor] Collected ${beachIds.length} beach IDs from ${userAlerts.length} alerts:`,
      beachIds
    );

    // Get beach ratings for today - check if the table exists first
    let beachRatings: Array<{
      beachId: string;
      score: number;
      starRating: number;
    }> = [];
    if (beachIds.length > 0) {
      try {
        console.log(
          `[Alert Processor] Fetching beach ratings for ${beachIds.length} beaches:`,
          beachIds
        );
        const todayStart = new Date(new Date(today).setHours(0, 0, 0, 0));
        const todayEnd = new Date(new Date(today).setHours(23, 59, 59, 999));

        console.log(
          `[Alert Processor] Querying beach ratings for date range: ${todayStart.toISOString()} to ${todayEnd.toISOString()}`
        );

        const ratingsData = await prisma.beachDailyScore.findMany({
          where: {
            beachId: { in: beachIds },
            date: {
              gte: todayStart,
              lt: todayEnd,
            },
          },
          select: {
            beachId: true,
            score: true,
            starRating: true,
          },
        });

        console.log(`[Alert Processor] Raw ratings data from DB:`, ratingsData);

        // Use starRating from DB if available, otherwise calculate from score (for old records)
        beachRatings = ratingsData.map((br) => ({
          beachId: br.beachId,
          score: br.score,
          starRating:
            br.starRating ?? Math.max(1, Math.min(5, Math.floor(br.score / 2))), // Use DB value or calculate
        }));
        console.log(
          `[Alert Processor] Found ${beachRatings.length} beach ratings:`,
          beachRatings.map((br) => ({
            beachId: br.beachId,
            score: br.score,
            starRating: br.starRating,
          }))
        );
      } catch (error) {
        console.log(
          "Error fetching beach ratings, continuing without them:",
          error
        );
      }
    } else {
      console.log(`[Alert Processor] No beach IDs found to query ratings for`);
    }

    for (const alert of userAlerts) {
      try {
        result.alertsChecked++;

        // Get the beach name and ID from logEntry or direct beach relation
        const beachName =
          alert.logEntry?.beach?.name ||
          alert.beach?.name ||
          "Unknown location";
        const beachId = alert.logEntry?.beach?.id || alert.beachId;

        // Find today's forecast for this alert's region (only needed for VARIABLES alerts)
        const todaysForecast = todaysForecasts.find(
          (f) => f.regionId === alert.regionId
        );

        // Only require forecast for VARIABLES alerts, not RATING alerts
        if (alert.alertType === AlertType.VARIABLES && !todaysForecast) {
          console.log(
            `No forecast found for region ${alert.regionId} today - skipping VARIABLES alert`
          );
          continue;
        }

        if (alert.alertType === AlertType.RATING && !todaysForecast) {
          console.log(
            `No forecast found for region ${alert.regionId} today - continuing for RATING alert (forecast not required)`
          );
        }

        // Check if alert conditions are met
        let shouldSendAlert = false;
        const match: AlertMatch = {
          alertId: alert.id,
          alertName: alert.name,
          region: alert.regionId,
          timestamp: new Date(),
          matchedProperties: [],
          matchDetails: "",
        };

        if (
          alert.alertType === AlertType.VARIABLES &&
          alert.properties?.length > 0
        ) {
          // For variable-based alerts, check if all properties are within range
          // Require forecast for VARIABLES alerts
          if (!todaysForecast) {
            console.log(
              `[Alert Processor] Skipping VARIABLES alert ${alert.name} - no forecast available`
            );
            continue;
          }

          shouldSendAlert = true; // Start with true and set to false if any property is out of range

          // Parse properties if it's a string
          const properties =
            typeof alert.properties === "string"
              ? JSON.parse(alert.properties)
              : alert.properties;

          for (const prop of properties) {
            const propertyName = prop.property;
            const range = prop.range;

            // Get the reference value from the log entry's forecast
            const logValue =
              alert.logEntry?.forecast?.[
                propertyName as keyof typeof alert.logEntry.forecast
              ];

            // Get today's forecast value for this property
            const forecastValue =
              todaysForecast[propertyName as keyof typeof todaysForecast];

            if (logValue !== undefined && forecastValue !== undefined) {
              // Check if today's value is within range of the log value
              const difference = Math.abs(
                Number(forecastValue) - Number(logValue)
              );
              const withinRange = difference <= Number(range);

              // Add to matched properties
              match.matchedProperties.push({
                property: propertyName,
                logValue: logValue,
                forecastValue: forecastValue,
                difference: difference,
                withinRange: withinRange,
              });

              // If any property is out of range, don't send alert
              if (!withinRange) {
                shouldSendAlert = false;
              }
            }
          }
        } else if (
          alert.alertType === AlertType.RATING &&
          alert.starRating &&
          beachId
        ) {
          // For rating-based alerts, check if beach rating meets criteria
          console.log(
            `[Alert Processor] Processing RATING alert: ${alert.name}, beachId=${beachId}, required starRating=${alert.starRating}`
          );
          const beachRating = beachRatings.find((br) => br.beachId === beachId);

          if (beachRating) {
            // Use starRating from calculated value (will use DB field once migration is run)
            const currentStarRating = beachRating.starRating;

            console.log(
              `[Alert Processor] Beach ${beachId} (${beachName}): score=${beachRating.score}, starRating=${currentStarRating}, alert requires >= ${alert.starRating}`
            );

            shouldSendAlert = currentStarRating >= alert.starRating;

            // Add to matched properties
            match.matchedProperties.push({
              property: "starRating",
              logValue: alert.starRating,
              forecastValue: currentStarRating.toString(),
              difference: Math.abs(currentStarRating - alert.starRating),
              withinRange: shouldSendAlert,
            });

            console.log(
              `[Alert Processor] RATING alert ${alert.name}: ${shouldSendAlert ? "WILL TRIGGER" : "will not trigger"} (${currentStarRating} >= ${alert.starRating})`
            );
          } else {
            console.log(
              `[Alert Processor] No beach rating found for beach ${beachId} (${beachName}) today. Available beachIds:`,
              beachRatings.map((br) => br.beachId)
            );
          }
        } else if (alert.alertType === AlertType.RATING) {
          console.log(
            `[Alert Processor] RATING alert ${alert.name} skipped: starRating=${alert.starRating}, beachId=${beachId}`
          );
        }

        // Send notification if conditions are met
        if (shouldSendAlert) {
          const success = await sendAlertNotification(match, alert, beachName);
          if (success) result.notificationsSent++;
        }
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
        result.errors++;
      }
    }

    return result;
  } catch (error) {
    console.error(`Error processing alerts for user ${userId}:`, error);
    throw error;
  }
}
