import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function diagnoseAlertEmail(userEmail?: string) {
  try {
    console.log("🔍 Diagnosing Alert Email Issues...\n");

    // 1. Check if RESEND_API_KEY is configured
    console.log("1️⃣ Checking Email Configuration:");
    const hasResendKey = !!process.env.RESEND_API_KEY;
    console.log(`   RESEND_API_KEY configured: ${hasResendKey ? "✅ Yes" : "❌ No"}`);
    if (!hasResendKey) {
      console.log("   ⚠️  RESEND_API_KEY is required for email notifications");
    }
    console.log("");

    // 2. Find user's alerts
    let user;
    if (userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, email: true, name: true },
      });
    } else {
      // Get first user with alerts
      const alert = await prisma.alert.findFirst({
        include: { user: { select: { id: true, email: true, name: true } } },
      });
      user = alert?.user || null;
    }

    if (!user) {
      console.log("❌ No user found");
      return;
    }

    console.log(`2️⃣ Checking Alerts for User: ${user.email} (${user.name || "No name"})\n`);

    // 3. Get user's alerts
    const alerts = await prisma.alert.findMany({
      where: { userId: user.id },
      include: {
        beach: { select: { name: true, id: true } },
        region: { select: { name: true } },
      },
    });

    if (alerts.length === 0) {
      console.log("   ❌ No alerts found for this user");
      return;
    }

    console.log(`   Found ${alerts.length} alert(s):\n`);

    for (const alert of alerts) {
      console.log(`   📌 Alert: "${alert.name}"`);
      console.log(`      ID: ${alert.id}`);
      console.log(`      Active: ${alert.active ? "✅ Yes" : "❌ No"}`);
      console.log(`      Notification Method: ${alert.notificationMethod}`);
      console.log(`      Contact Info: ${alert.contactInfo}`);
      console.log(`      Beach: ${alert.beach?.name || alert.beachId || "N/A"}`);
      console.log(`      Region: ${alert.region?.name || alert.regionId || "N/A"}`);

      // Check for recent notifications
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const recentNotifications = await prisma.alertNotification.findMany({
        where: {
          alertId: alert.id,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      console.log(`      Notifications sent today: ${recentNotifications.length}`);
      if (recentNotifications.length > 0) {
        console.log(`      ⚠️  Alert already sent today - won't send again until tomorrow`);
        recentNotifications.forEach((notif, i) => {
          console.log(`         ${i + 1}. Sent at: ${notif.createdAt.toISOString()}, Success: ${notif.success}`);
        });
      }

      // Show alert requirements
      console.log(`      Alert Type: ${alert.alertType}`);
      if (alert.logEntryId) {
        console.log(`      Log Entry ID: ${alert.logEntryId}`);
        
        // Get log entry details
        const logEntry = await prisma.logEntry.findUnique({
          where: { id: alert.logEntryId },
          include: {
            forecast: true,
          },
        });
        
        if (logEntry) {
          console.log(`      ✅ Log entry found`);
          if (logEntry.forecast) {
            console.log(`      ✅ Log entry has forecast data`);
            console.log(`         Forecast: Wind ${logEntry.forecast.windSpeed}kts ${logEntry.forecast.windDirection}, Swell ${logEntry.forecast.swellHeight}m ${logEntry.forecast.swellDirection}, Period ${logEntry.forecast.swellPeriod}s`);
          } else {
            console.log(`      ❌ Log entry has NO forecast data - VARIABLES alert cannot work without this!`);
          }
        } else {
          console.log(`      ❌ Log entry not found - VARIABLES alert requires a log entry`);
        }
      } else {
        console.log(`      ⚠️  No log entry ID - VARIABLES alerts require a log entry to compare against`);
      }
      
      if (alert.starRating) {
        console.log(`      Required Star Rating: ${alert.starRating}/5`);
      }
      if (alert.properties && Array.isArray(alert.properties) && alert.properties.length > 0) {
        console.log(`      Required Properties:`);
        alert.properties.forEach((prop: any) => {
          const range = prop.range || `${prop.min} - ${prop.max}`;
          console.log(`         - ${prop.property}: within ${range} of log entry value`);
        });
      }
      
      // Check forecast data for VARIABLES alerts
      if (alert.alertType === "VARIABLES" && alert.regionId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const forecasts = await prisma.forecast.findMany({
          where: {
            regionId: alert.regionId,
            date: {
              gte: today,
            },
          },
          orderBy: { date: "asc" },
          take: 3,
        });
        
        if (forecasts.length > 0) {
          console.log(`      Forecast data available: ${forecasts.length} forecast(s) for today`);
          forecasts.forEach((f, i) => {
            console.log(`         ${i + 1}. ${f.date.toISOString().split('T')[0]} - ${f.source}: Wind ${f.windSpeed}kts ${f.windDirection}, Swell ${f.swellHeight}m ${f.swellDirection}, Period ${f.swellPeriod}s`);
          });
        } else {
          console.log(`      ⚠️  No forecast data found for today - alert cannot be evaluated`);
        }
      }

      // Check if alert conditions match (simplified check)
      if (alert.beachId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const beachScores = await prisma.beachDailyScore.findMany({
          where: {
            beachId: alert.beachId,
            date: {
              gte: today,
            },
          },
          orderBy: { date: "desc" },
        });

        if (beachScores.length > 0) {
          console.log(`      Latest beach scores for today:`);
          beachScores.forEach((score) => {
            console.log(`         - ${score.source}: ${score.starRating}/5`);
          });
          
          const maxRating = Math.max(...beachScores.map(s => s.starRating));
          if (alert.starRating) {
            if (maxRating >= alert.starRating) {
              console.log(`      ✅ Conditions MATCH! (${maxRating} >= ${alert.starRating})`);
              console.log(`      ⚠️  Alert should have triggered - checking why it didn't...`);
            } else {
              console.log(`      ❌ Conditions don't match (${maxRating} < ${alert.starRating})`);
            }
          }
        } else {
          console.log(`      ⚠️  No beach scores found for today`);
        }
      }

      console.log("");
    }

    // 4. Check recent cron job runs
    console.log("3️⃣ Checking Recent Cron Job Activity:\n");
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

    const recentScores = await prisma.beachDailyScore.findMany({
      where: {
        createdAt: {
          gte: sixHoursAgo,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (recentScores.length > 0) {
      console.log(`   ✅ Cron job has run recently (found ${recentScores.length} recent scores)`);
      console.log(`   Latest score created: ${recentScores[0].createdAt.toISOString()}`);
    } else {
      console.log(`   ⚠️  No recent beach scores found - cron job may not have run in the last 6 hours`);
      console.log(`   Cron schedule: 02:00 UTC and 20:00 UTC daily`);
    }

    console.log("");

    // 5. Summary
    console.log("📋 Summary:");
    console.log(`   - Email configured: ${hasResendKey ? "✅" : "❌"}`);
    console.log(`   - User has alerts: ${alerts.length > 0 ? "✅" : "❌"}`);
    console.log(`   - Active alerts: ${alerts.filter(a => a.active).length}`);
    console.log(`   - Cron job active: ${recentScores.length > 0 ? "✅" : "⚠️"}`);

    if (!hasResendKey) {
      console.log("\n❌ ACTION REQUIRED: Set RESEND_API_KEY environment variable");
    }
    if (alerts.filter(a => !a.active).length > 0) {
      console.log("\n⚠️  Some alerts are inactive - activate them in the dashboard");
    }
    if (recentScores.length === 0) {
      console.log("\n⚠️  Cron job may not be running - check backend logs or trigger manually");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line or use default
const userEmail = process.argv[2];
diagnoseAlertEmail(userEmail);

