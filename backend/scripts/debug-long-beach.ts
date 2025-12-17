
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugLongBeachAlert() {
  console.log("🔍 Debugging Long Beach Alert Logic for Today");
  console.log("-------------------------------------------");

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  console.log(`Checking for date: ${startOfDay.toISOString()}`);

  try {
    // 1. Get Long Beach Details
    const beachId = "long-beach";
    const beach = await prisma.beach.findUnique({
      where: { id: beachId },
    });

    if (!beach) {
      console.error("❌ Long Beach not found in database!");
      return;
    }
    console.log("✅ Found Long Beach:", beach.name, `(${beach.id})`);

    // 2. Check for Scores today
    const scores = await prisma.beachDailyScore.findMany({
      where: {
        beachId: beachId,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        }
      },
    });

    console.log(`\n📊 Found ${scores.length} score entries for today:`);
    if (scores.length === 0) {
      console.error("❌ No scores found for Long Beach today! Cron job may not have saved them.");
    } else {
      scores.forEach(s => {
        console.log(`   - Source: ${s.source}, Score: ${s.score}, Star Rating: ${s.starRating ?? "N/A"}`);
      });
    }

    // 3. Find User Alerts for Long Beach
    const alerts = await prisma.alert.findMany({
      where: {
        OR: [
          { beachId: beachId },
          { logEntry: { beachId: beachId } }
        ],
        active: true
      },
      include: {
        user: { select: { email: true } }
      }
    });

    console.log(`\n🔔 Found ${alerts.length} active alerts for Long Beach:`);
    alerts.forEach(a => {
      console.log(`   - Alert ID: ${a.id}`);
      console.log(`     User: ${a.user.email}`);
      console.log(`     Type: ${a.alertType}`);
      console.log(`     Rating Required: ${a.starRating ?? "N/A"}`);
      console.log(`     Beach ID connection: ${a.beachId ?? "via Log Entry"}`);
      
      // Simulate Logic
      if (a.alertType === "RATING") {
        const required = a.starRating || 0;
        // Check if any score meets criteria
        // Note: Logic in alertProcessor uses ANY source match? No, it looks for "beachRatings" generally.
        // Let's see if we have ANY score >= required.
        const maxRating = Math.max(...scores.map(s => s.starRating || 0));
        const matched = maxRating >= required;
        console.log(`     --> Simulation: Required ${required}+, Max Found: ${maxRating}. Success? ${matched ? "YES ✅" : "NO ❌"}`);
      }
    });

  } catch (error) {
    console.error("Error running debug script:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLongBeachAlert();
