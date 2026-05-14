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
  slots: Array<{
    slot: string;
    matchedProperties: Array<{
      property: string;
      logValue: any;
      forecastValue: any;
      difference: number;
      withinRange: boolean;
    }>;
  }>;
  matchDetails: string;
}

export async function processUserAlerts(userId: string, today: Date) {
  // Ensure today is at UTC midnight
  const targetDate = new Date(today);
  targetDate.setUTCHours(0, 0, 0, 0);

  console.log(`[Alert Processor] 🛰️ Processing alerts for user ${userId} on target date: ${targetDate.toISOString().split('T')[0]}`);

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
        date: targetDate, // Exact date match for UTC 00:00:00
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
            date: targetDate,
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

        const beachName =
          (alert.logEntry as any)?.beach?.name ||
          (alert.beach as any)?.name ||
          "Unknown location";
        const beachId = (alert.logEntry as any)?.beach?.id || alert.beachId;

        const alertSources =
          alert.sources && alert.sources.length > 0
            ? alert.sources
            : ["WINDFINDER"];

        const matchingForecasts = todaysForecasts.filter(
          (f) => f.regionId === alert.regionId && alertSources.includes(f.source as any)
        );

        const match: AlertMatch = {
          alertId: alert.id,
          alertName: alert.name,
          region: alert.regionId,
          timestamp: new Date(),
          slots: [],
          matchDetails: "",
        };

        for (const slot of ["MORNING", "NOON", "EVENING"]) {
          const slotForecast = matchingForecasts.find(f => f.timeSlot === slot);
          const slotRating = beachRatings.find(br => 
            br.beachId === beachId && 
            (br as any).timeSlot === slot && 
            alertSources.includes(br.source as any)
          );

          if (!slotForecast && !slotRating) continue;

          let slotMatches = false;
          const matchedProperties: any[] = [];

          if ((alert.alertType as any) === AlertType.VARIABLES && slotForecast) {
            slotMatches = true;
            for (const prop of alert.properties) {
              const propertyName = (prop as any).property;
              const range = (prop as any).range;
              const logValue = (alert.logEntry as any)?.forecast?.[propertyName];
              const forecastValue = slotForecast[propertyName as keyof typeof slotForecast];

              if (logValue !== undefined && forecastValue !== undefined) {
                const difference = Math.abs(Number(forecastValue) - Number(logValue));
                const withinRange = difference <= Number(range);
                matchedProperties.push({
                  property: propertyName,
                  logValue: logValue,
                  forecastValue: forecastValue,
                  difference: difference,
                  withinRange: withinRange,
                });
                if (!withinRange) slotMatches = false;
              }
            }
          } else if ((alert.alertType as any) === AlertType.RATING && slotRating) {
            const currentStarRating = slotRating.starRating;
            slotMatches = currentStarRating >= alert.starRating!;
            matchedProperties.push({
              property: "starRating",
              logValue: alert.starRating,
              forecastValue: currentStarRating.toString(),
              difference: Math.abs(currentStarRating - alert.starRating!),
              withinRange: slotMatches,
            });
          }

          if (slotMatches) {
            match.slots.push({
              slot,
              matchedProperties,
            });
          }
        }

        if (match.slots.length > 0) {
          const { sendAlertNotification } = await import("./notificationService");
          console.log(`[Alert Processor] TRIGGERING aggregated notification for alert ${alert.name} (${match.slots.length} slots)`);
          const success = await sendAlertNotification(match, alert as any, beachName, today);
          if (success) {
            result.notificationsSent++;
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
    today.setUTCHours(0, 0, 0, 0);

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

    // Process alerts for each user across a 3-day tactical window (Today + 2 days ahead)
    for (const user of usersWithAlerts) {
      try {
        console.log(
          `[Alert Processor] Processing 3-day window for user: ${user.id} (${user.email || "no email"})`
        );
        
        for (let i = 0; i < 3; i++) {
          const targetDate = new Date(today);
          targetDate.setUTCDate(today.getUTCDate() + i);
          
          const dateLabel = i === 0 ? "TODAY" : i === 1 ? "TOMORROW" : "DAY AFTER";
          console.log(`[Alert Processor] Checking ${dateLabel} (${targetDate.toISOString().split('T')[0]})`);
          
          const userResult = await processUserAlerts(user.id, targetDate);

          // results.usersProcessed++; // Moved outside the inner loop
          results.alertsChecked += userResult.alertsChecked;
          results.notificationsSent += userResult.notificationsSent;
          results.errors += userResult.errors;
        }
        
        results.usersProcessed++;
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
