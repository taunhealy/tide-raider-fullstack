import { prisma } from "@/app/lib/prisma";
import { sendEmail } from "@/app/lib/email";
import { sendWhatsAppMessage } from "@/app/lib/whatsapp";
import { getLatestConditions } from "@/app/api/surf-conditions/route";
import { ForecastA, AlertType } from "@prisma/client";

// Track which regions we've already fetched today to avoid duplicate API calls
const fetchedForecasts = new Map();

export async function processUserAlerts(userId: string, today: Date) {
  const result = {
    alertsChecked: 0,
    notificationsSent: 0,
    errors: 0,
  };

  try {
    // 1. Get all active alerts for this user
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
          },
        },
        properties: true,
      },
      orderBy: {
        regionId: "asc", // Group by region to optimize forecast fetching
      },
    });

    if (userAlerts.length === 0) {
      return result;
    }

    // 2. Check if any alerts have already been processed today
    const processedAlertIds = await prisma.alertCheck.findMany({
      where: {
        alertId: { in: userAlerts.map((a) => a.id) },
        checkedAt: {
          gte: new Date(today.getTime()),
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      select: { alertId: true },
    });

    const processedAlertIdSet = new Set(
      processedAlertIds.map((p) => p.alertId)
    );

    // 3. Process each alert that hasn't been checked today
    let currentRegion: string | null = null;
    let currentForecast: ForecastA | null = null;

    for (const alert of userAlerts) {
      try {
        // Skip if already processed today
        if (processedAlertIdSet.has(alert.id)) {
          console.log(`⏭️ Alert ${alert.id} already checked today, skipping`);
          continue;
        }

        result.alertsChecked++;

        // If we're processing a new region, fetch its forecast
        if (currentRegion !== alert.regionId) {
          currentRegion = alert.regionId;

          // Check if we already fetched this region's forecast today
          if (fetchedForecasts.has(currentRegion)) {
            currentForecast = fetchedForecasts.get(currentRegion);
            console.log(`📋 Using cached forecast for ${currentRegion}`);
          } else {
            console.log(`🌊 Fetching forecast for ${currentRegion}`);

            // First check if we already have this forecast in the database
            const existingForecast = await prisma.forecastA.findFirst({
              where: {
                regionId: currentRegion,
                date: today,
              },
            });

            if (existingForecast) {
              currentForecast = existingForecast;
              console.log(
                `📋 Using existing database forecast for ${currentRegion}`
              );
            } else {
              // Fetch new forecast data from API
              const apiForecaseData = await getLatestConditions(
                false,
                currentRegion
              );

              if (!apiForecaseData) {
                console.error(
                  `❌ Failed to fetch forecast for ${currentRegion}`
                );
                result.errors++;
                continue;
              }

              // The API already returns a ForecastA object, so just use it
              currentForecast = apiForecaseData;
            }

            // Cache the forecast
            fetchedForecasts.set(currentRegion, currentForecast);
          }
        }

        if (!currentForecast) {
          console.error(`❌ No forecast available for ${currentRegion}`);
          result.errors++;

          // Record that we checked this alert
          await prisma.alertCheck.create({
            data: {
              alertId: alert.id,
              checkedAt: new Date(),
              success: false,
              details: "No forecast available",
            },
          });

          continue;
        }

        // Check if conditions match based on alert type
        let conditionsMatch = false;
        let matchDetails = "";

        if (alert.alertType === AlertType.VARIABLES) {
          // For variable-based alerts, we need a reference forecast (usually from a log entry)
          const referenceForecast = alert.logEntry?.forecast;

          if (!referenceForecast) {
            console.log(`⚠️ No reference forecast for alert ${alert.id}`);

            // Record that we checked this alert
            await prisma.alertCheck.create({
              data: {
                alertId: alert.id,
                checkedAt: new Date(),
                success: false,
                details: "No reference forecast available",
              },
            });

            continue;
          }

          // Check if all properties are within range
          const matchingProps: string[] = [];
          const allPropsMatch = alert.properties?.every((prop) => {
            const forecastValue =
              currentForecast?.[prop.property as keyof typeof currentForecast];
            const referenceValue =
              referenceForecast?.[
                prop.property as keyof typeof referenceForecast
              ];

            if (
              typeof forecastValue === "number" &&
              typeof referenceValue === "number"
            ) {
              const isMatch =
                Math.abs(forecastValue - referenceValue) <= prop.range;
              if (isMatch) {
                matchingProps.push(
                  `${prop.property}: ${forecastValue} (within ±${prop.range} of ${referenceValue})`
                );
              }
              return isMatch;
            }
            return false;
          });

          conditionsMatch = allPropsMatch;
          if (conditionsMatch) {
            matchDetails = matchingProps.join(", ");
          }
        } else if (alert.alertType === AlertType.RATING) {
          // We should query the stored score
          const dailyScore = await prisma.beachDailyScore.findFirst({
            where: {
              regionId: alert.regionId,
              date: today,
            },
          });

          const score = dailyScore?.score || 0;

          conditionsMatch =
            alert.starRating !== null && score >= alert.starRating;

          if (conditionsMatch) {
            matchDetails = `Star rating: ${score}`;
          }
        }

        // Record that we checked this alert
        await prisma.alertCheck.create({
          data: {
            alertId: alert.id,
            checkedAt: new Date(),
            success: true,
            details: conditionsMatch
              ? `Conditions match: ${matchDetails}`
              : "Conditions do not match",
          },
        });

        // If conditions match, send notification
        if (conditionsMatch) {
          console.log(`🎯 Match found for alert ${alert.id} (${alert.name})`);

          // Check if we've already notified for this alert today
          const recentNotification = await prisma.alertNotification.findFirst({
            where: {
              alertId: alert.id,
              createdAt: {
                gte: new Date(today.getTime()),
                lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
              },
            },
          });

          if (recentNotification) {
            console.log(`⏭️ Already notified for alert ${alert.id} today`);
            continue;
          }

          // Send notification based on method
          let notificationSuccess = false;

          if (
            alert.notificationMethod === "email" ||
            alert.notificationMethod === "both"
          ) {
            const emailSuccess = await sendAlertEmail(
              alert.contactInfo,
              alert.name,
              alert.regionId,
              matchDetails,
              alert.user?.name || "User"
            );
            notificationSuccess = emailSuccess;
          }

          if (
            alert.notificationMethod === "whatsapp" ||
            alert.notificationMethod === "both"
          ) {
            const whatsappSuccess = await sendAlertWhatsApp(
              alert.contactInfo,
              alert.name,
              alert.regionId,
              matchDetails
            );
            notificationSuccess = notificationSuccess || whatsappSuccess;
          }

          // Record the notification
          await prisma.alertNotification.create({
            data: {
              alertId: alert.id,
              success: notificationSuccess,
              details: matchDetails,
            },
          });

          if (notificationSuccess) {
            result.notificationsSent++;
          } else {
            result.errors++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing alert ${alert.id}:`, error);
        result.errors++;
      }
    }

    return result;
  } catch (error) {
    console.error(`❌ Error processing alerts for user ${userId}:`, error);
    throw error;
  }
}

// Email and WhatsApp functions remain the same as in the previous implementation
async function sendAlertEmail(
  email: string,
  alertName: string,
  region: string,
  matchDetails: string,
  userName: string
): Promise<boolean> {
  try {
    await sendEmail(
      email,
      `🌊 Surf Alert: ${alertName}`,
      `Hi ${userName},\n\nYour surf alert "${alertName}" has matched today's conditions at ${region}.\n\nDetails: ${matchDetails}\n\nHappy surfing!`
    );
    return true;
  } catch (error) {
    console.error(`Failed to send alert email:`, error);
    return false;
  }
}

async function sendAlertWhatsApp(
  phoneNumber: string,
  alertName: string,
  region: string,
  matchDetails: string
): Promise<boolean> {
  try {
    await sendWhatsAppMessage(
      phoneNumber,
      `🌊 Surf Alert: ${alertName}\n\nYour surf alert "${alertName}" has matched today's conditions at ${region}.\n\nDetails: ${matchDetails}\n\nHappy surfing!`
    );
    return true;
  } catch (error) {
    console.error(`Failed to send alert WhatsApp message:`, error);
    return false;
  }
}
