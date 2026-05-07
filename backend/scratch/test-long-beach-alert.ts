import { PrismaClient } from "@prisma/client";
import { processUserAlerts } from "../src/services/alertProcessor";

const prisma = new PrismaClient();

async function main() {
  const email = "taunhealy@gmail.com";
  console.log(`\n--- TACTICAL ALERT TEST: ${email} ---\n`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      alerts: {
        where: {
          active: true,
          name: { contains: "Long Beach", mode: "insensitive" }
        }
      }
    }
  });

  if (!user) {
    console.log("❌ User not found.");
    return;
  }

  console.log(`✅ Found user: ${user.id}`);
  console.log(`✅ Found ${user.alerts.length} matching alerts:`);
  user.alerts.forEach(a => {
    console.log(`   - [${a.id}] ${a.name}: target ${a.starRating} stars, method ${a.notificationMethod}`);
  });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  console.log(`\n🔍 Checking 'long-beach' scores for today (${today.toISOString()}):`);
  
  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beachId: "long-beach",
      date: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  if (scores.length > 0) {
    console.log(`✅ Found ${scores.length} scores:`);
    scores.forEach(s => console.log(`   - ${s.timeSlot}: ${s.starRating} stars (score: ${s.score})`));
  } else {
    console.log("⚠️ No scores today. Looking for upcoming...");
    const upcoming = await prisma.beachDailyScore.findMany({
      where: { beachId: "long-beach", date: { gte: today } },
      take: 3,
      orderBy: { date: 'asc' }
    });
    upcoming.forEach(s => console.log(`   - ${s.date.toISOString()} ${s.timeSlot}: ${s.starRating} stars`));
  }

  console.log("\n🚀 EXECUTING Alert Processor...");
  const result = await processUserAlerts(user.id, today);
  console.log("\n--- TEST COMPLETE ---");
  console.log("Final Result:", result);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
