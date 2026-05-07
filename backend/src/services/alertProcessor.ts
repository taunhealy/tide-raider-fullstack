import { prisma } from "../lib/prisma";

// AlertType enum
enum AlertType {
  VARIABLES = "VARIABLES",
  RATING = "RATING",
}

// AlertMatch interface
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
    // Fetch ALL sources, we will filter in memory based on alert preferences
    const regions = [...new Set(userAlerts.map((alert) => alert.regionId))];

    const todaysForecasts = await prisma.forecast.findMany({
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
        const beachId =
          (alert.logEntry as any)?.beach?.id ||
          (alert.beach as any)?.id ||
          alert.beachId;
        if ((alert.alertType as any) === AlertType.RATING && !beachId) {
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

    // Get beach ratings for today
    let beachRatings: Array<{
      beachId: string;
      score: number;
      starRating: number;
      timeSlot: string;
      source: string;
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
            date: true, 
            timeSlot: true,
            source: true,
          },
        });

        console.log(`[Alert Processor] Raw ratings data from DB (${ratingsData.length} items):`, 
          ratingsData.map(r => ({ ...r, date: r.date.toISOString() }))
        );

        // Use starRating from DB if available, otherwise calculate from score
        beachRatings = ratingsData.map((br) => ({
          beachId: br.beachId,
          score: br.score,
          timeSlot: br.timeSlot,
          source: br.source,
          starRating:
            br.starRating ?? Math.max(1, Math.min(5, Math.floor(br.score / 2))),
        }));
        console.log(
          `[Alert Processor] Processed ${beachRatings.length} beach ratings mappings`
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
          (alert.logEntry as any)?.beach?.name ||
          (alert.beach as any)?.name ||
          "Unknown location";
        const beachId = (alert.logEntry as any)?.beach?.id || alert.beachId;

        // Find today's forecasts for this alert's region and preferred sources
        const alertSources =
          alert.sources && alert.sources.length > 0
            ? alert.sources
            : ["WINDFINDER"]; // Default to WINDFINDER if not specified

        // Get all matching forecasts for today (across all time slots)
        const matchingForecasts = todaysForecasts.filter(
          (f) => f.regionId === alert.regionId && alertSources.includes(f.source as any)
        );

        if (matchingForecasts.length === 0 && (alert.alertType as any) === AlertType.VARIABLES) {
          console.log(`No forecast found for region ${alert.regionId} today - skipping VARIABLES alert`);
          continue;
        }

        // Define which ratings correspond to which forecasts
        // For RATING alerts, we'll check all slots available in beachRatings
        const targetSlots = matchingForecasts.map(f => f.timeSlot);
        if (targetSlots.length === 0 && (alert.alertType as any) === AlertType.RATING) {
          // If no forecasts recorded, check all slots that have ratings
          const uniqueSlots = [...new Set(beachRatings.filter(br => br.beachId === beachId).map(br => (br as any).timeSlot))];
          targetSlots.push(...(uniqueSlots as any[]));
        }

        // Track seen alerts to prevent duplicate notifications for same slot/source
        const processedSlots = new Set<string>();

        // We inner-loop through target slots to check conditions for each
        for (const slot of ["MORNING", "NOON", "EVENING"]) {
          // Find the forecast and rating for this specific slot and source
          // We prioritize the alert's preferred sources
          const slotForecast = matchingForecasts.find(f => f.timeSlot === slot);
          const slotRating = beachRatings.find(br => 
            br.beachId === beachId && 
            (br as any).timeSlot === slot && 
            alertSources.includes(br.source as any)
          );

          if (!slotForecast && !slotRating) continue;

          let shouldSendAlert = false;
          const match: AlertMatch = {
            alertId: alert.id,
            alertName: `${alert.name} (${slot})`,
            region: alert.regionId,
            timestamp: new Date(),
            matchedProperties: [],
            matchDetails: "",
          };

          if ((alert.alertType as any) === AlertType.VARIABLES && slotForecast) {
            shouldSendAlert = true;
            for (const prop of alert.properties) {
              const propertyName = (prop as any).property;
              const range = (prop as any).range;
              const logValue = (alert.logEntry as any)?.forecast?.[propertyName];
              const forecastValue = slotForecast[propertyName as keyof typeof slotForecast];

              if (logValue !== undefined && forecastValue !== undefined) {
                const difference = Math.abs(Number(forecastValue) - Number(logValue));
                const withinRange = difference <= Number(range);
                match.matchedProperties.push({
                  property: propertyName,
                  logValue: logValue,
                  forecastValue: forecastValue,
                  difference: difference,
                  withinRange: withinRange,
                });
                if (!withinRange) shouldSendAlert = false;
              }
            }
          } else if ((alert.alertType as any) === AlertType.RATING && slotRating) {
            const currentStarRating = slotRating.starRating;
            shouldSendAlert = currentStarRating >= alert.starRating!;
            console.log(`[Alert Processor] Checking RATING alert ${alert.name} for slot ${slot}: current=${currentStarRating}, target=${alert.starRating} -> result=${shouldSendAlert}`);
            match.matchedProperties.push({
              property: "starRating",
              logValue: alert.starRating,
              forecastValue: currentStarRating.toString(),
              difference: Math.abs(currentStarRating - alert.starRating!),
              withinRange: shouldSendAlert,
            });
          }

          if (shouldSendAlert) {
            const { sendAlertNotification } = await import("./notificationService");
            // Check if we've already notified for this specific alert today for this slot
            // To prevent spam if re-run, but for now we follow "all slots" literal
            console.log(`[Alert Processor] TRIGGERING notification for alert ${alert.name} (${slot})`);
            const success = await sendAlertNotification(match, alert as any, beachName);
            if (success) {
              console.log(`[Alert Processor] SUCCESS: Notification sent for alert ${alert.id}`);
              result.notificationsSent++;
            } else {
              console.log(`[Alert Processor] FAILED: Notification not sent for alert ${alert.id}`);
            }
          }
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

/**
 * Process alerts for all users with active alerts
 * Used by cron jobs to check all users at once
 * @param isAccelerated If true, only process Premium/Trial users (high-frequency pulse)
 */
export async function processAllUserAlerts(isAccelerated = false) {
  const results = {
    usersProcessed: 0,
    alertsChecked: 0,
    notificationsSent: 0,
    errors: 0,
    errorDetails: [] as string[],
  };

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get users with active alerts
    // If accelerated, only get students with ACTIVE subscription or TRIAL
    const usersWithAlerts = await prisma.user.findMany({
      where: {
        alerts: {
          some: {
            active: true,
          },
        },
        ...(isAccelerated && {
          OR: [
            { subscriptionStatus: "ACTIVE" },
            { 
              hasActiveTrial: true,
              trialEndDate: {
                gt: new Date()
              }
            },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionStatus: true,
        hasActiveTrial: true,
      },
    });

    console.log(`[Heartbeat] ${isAccelerated ? 'Accelerated' : 'Full'} Mode: Found ${usersWithAlerts.length} users to process`);

    // Process alerts for each user
    for (const user of usersWithAlerts) {
      try {
        console.log(
          `Processing alerts for user: ${user.id} (${user.email || "no email"})`
        );
        const userResult = await processUserAlerts(user.id, today);

        results.usersProcessed++;
        results.alertsChecked += userResult.alertsChecked;
        results.notificationsSent += userResult.notificationsSent;
        results.errors += userResult.errors;
      } catch (error) {
        console.error(`Error processing alerts for user ${user.id}:`, error);
        results.errors++;
        results.errorDetails.push(
          `${user.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return results;
  } catch (error) {
    console.error("Error in processAllUserAlerts:", error);
    throw error;
  }
}
