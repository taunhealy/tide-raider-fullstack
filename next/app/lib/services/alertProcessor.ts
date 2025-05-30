import { prisma } from "@/app/lib/prisma";
import { sendAlertNotification } from "./notificationService";

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
      },
    });

    // Get today's forecasts for all relevant regions
    const regions = [...new Set(userAlerts.map((alert) => alert.region))];
    const todaysForecasts = await prisma.forecastA.findMany({
      where: {
        region: { in: regions },
        date: {
          gte: new Date(new Date(today).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(today).setHours(23, 59, 59, 999)),
        },
      },
    });

    // Get beach IDs from alerts
    const beachIds = userAlerts
      .filter((alert) => alert.logEntry?.beach?.id)
      .map((alert) => alert.logEntry?.beach?.id)
      .filter((id) => id !== undefined && id !== null) as string[];

    // Get beach ratings for today - check if the table exists first
    let beachRatings: Array<{ beachId: string; score: number }> = [];
    if (beachIds.length > 0) {
      try {
        beachRatings = await prisma.beachGoodRating.findMany({
          where: {
            beachId: { in: beachIds },
            date: {
              gte: new Date(new Date(today).setHours(0, 0, 0, 0)),
              lt: new Date(new Date(today).setHours(23, 59, 59, 999)),
            },
          },
          select: {
            beachId: true,
            score: true,
          },
        });
      } catch (error) {
        console.log(
          "Error fetching beach ratings, continuing without them:",
          error
        );
      }
    }

    for (const alert of userAlerts) {
      try {
        result.alertsChecked++;

        // Get the beach name from the logEntry relationship if available
        const beachName = alert.logEntry?.beach?.name || "Unknown location";
        const beachId = alert.logEntry?.beach?.id;

        // Find today's forecast for this alert's region
        const todaysForecast = todaysForecasts.find(
          (f) => f.region === alert.region
        );

        if (!todaysForecast) {
          console.log(`No forecast found for region ${alert.region} today`);
          continue;
        }

        // Check if alert conditions are met
        let shouldSendAlert = false;
        const match: AlertMatch = {
          alertId: alert.id,
          alertName: alert.name,
          region: alert.region,
          timestamp: new Date(),
          matchedProperties: [],
          matchDetails: "",
        };

        if (
          alert.alertType === "variables" &&
          alert.properties &&
          Array.isArray(alert.properties)
        ) {
          // For variable-based alerts, check if all properties are within range
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
          alert.alertType === "rating" &&
          alert.starRating &&
          beachId
        ) {
          // For rating-based alerts, check if beach rating meets criteria
          const beachRating = beachRatings.find((br) => br.beachId === beachId);

          if (beachRating) {
            const rating = beachRating.score;
            let ratingThreshold = 0;

            if (alert.starRating === "4+") {
              ratingThreshold = 4;
            } else if (alert.starRating === "5") {
              ratingThreshold = 5;
            }

            shouldSendAlert = rating >= ratingThreshold;

            // Add to matched properties
            match.matchedProperties.push({
              property: "starRating",
              logValue: alert.starRating,
              forecastValue: rating.toString(),
              difference: 0,
              withinRange: shouldSendAlert,
            });
          } else {
            console.log(`No beach rating found for beach ${beachId} today`);
          }
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
