/**
 * Check if cron job ran this morning by querying recent BeachDailyScore records
 * Run: npx tsx check-cron-ran.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkCronRan() {
  try {
    console.log("🔍 Checking if cron job ran this morning...\n");

    // Get current time info
    const now = new Date();
    const todayUTC = new Date(now.toISOString().split("T")[0]);
    
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Today (UTC midnight): ${todayUTC.toISOString()}\n`);

    // Check for BeachDailyScore records created in the last 6 hours
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    
    const recentScores = await prisma.beachDailyScore.findMany({
      where: {
        createdAt: {
          gte: sixHoursAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        beachId: true,
        regionId: true,
        source: true,
        date: true,
        score: true,
        createdAt: true,
      },
    });

    if (recentScores.length > 0) {
      console.log(`✅ Found ${recentScores.length} beach scores created in the last 6 hours:`);
      console.log("\nMost recent scores:");
      recentScores.slice(0, 5).forEach((score, i) => {
        console.log(`  ${i + 1}. Beach: ${score.beachId.substring(0, 20)}...`);
        console.log(`     Region: ${score.regionId}`);
        console.log(`     Source: ${score.source}`);
        console.log(`     Score: ${score.score}`);
        console.log(`     Created: ${score.createdAt.toISOString()}`);
        console.log("");
      });
      
      const mostRecent = recentScores[0];
      const minutesAgo = Math.floor((now.getTime() - mostRecent.createdAt.getTime()) / 60000);
      console.log(`\n📊 Most recent data was created ${minutesAgo} minutes ago`);
      
      if (minutesAgo < 60) {
        console.log("✅ Cron job likely ran within the last hour!");
      } else if (minutesAgo < 240) {
        console.log("✅ Cron job likely ran within the last 4 hours (normal schedule)");
      } else {
        console.log("⚠️  Last data is older than 4 hours - cron may have missed a run");
      }
    } else {
      console.log("❌ No beach scores found in the last 6 hours");
      console.log("⚠️  Cron job may not have run, or there's an issue with data fetching");
      
      // Check if there's ANY data
      const totalScores = await prisma.beachDailyScore.count();
      console.log(`\nTotal beach scores in database: ${totalScores}`);
      
      if (totalScores === 0) {
        console.log("⚠️  Database has no beach scores at all - cron may never have run successfully");
      }
    }

    // Check AlertNotification for recent alert processing
    console.log("\n📧 Checking recent alert notifications...");
    const recentAlerts = await prisma.alertNotification.findMany({
      where: {
        createdAt: {
          gte: sixHoursAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    if (recentAlerts.length > 0) {
      console.log(`✅ Found ${recentAlerts.length} alert notifications in the last 6 hours`);
      recentAlerts.forEach((alert, i) => {
        console.log(`  ${i + 1}. Alert: ${alert.alertName || "N/A"}`);
        console.log(`     Beach: ${alert.beachName || "N/A"}`);
        console.log(`     Success: ${alert.success}`);
        console.log(`     Created: ${alert.createdAt.toISOString()}`);
        console.log("");
      });
    } else {
      console.log("ℹ️  No alert notifications in the last 6 hours (this is normal if no alerts were triggered)");
    }

    // Cron schedule info
    console.log("\n📅 Cron Schedule (UTC):");
    console.log("  - 00:00 UTC (midnight)");
    console.log("  - 04:00 UTC (4 AM)");
    console.log("  - 08:00 UTC (8 AM)");
    console.log("  - 12:00 UTC (noon)");
    console.log("  - 16:00 UTC (4 PM)");
    console.log("  - 20:00 UTC (8 PM)");
    
    const currentUTCHour = now.getUTCHours();
    console.log(`\nCurrent UTC time: ${now.getUTCHours()}:${String(now.getUTCMinutes()).padStart(2, '0')}`);
    
    // Calculate next run
    const cronHours = [0, 4, 8, 12, 16, 20];
    const nextHour = cronHours.find(h => h > currentUTCHour) || cronHours[0];
    const hoursUntilNext = nextHour > currentUTCHour 
      ? nextHour - currentUTCHour 
      : (24 - currentUTCHour) + nextHour;
    
    console.log(`⏰ Next scheduled run: ${String(nextHour).padStart(2, '0')}:00 UTC (in ~${hoursUntilNext} hours)`);

  } catch (error) {
    console.error("❌ Error checking cron status:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCronRan();
