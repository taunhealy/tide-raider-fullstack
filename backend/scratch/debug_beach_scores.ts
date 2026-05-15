import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beachId = "kalk-bay-reef";
  const dateStr = "2026-05-09";
  const date = new Date(dateStr);
  date.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setUTCHours(23, 59, 59, 999);

  console.log(`🔍 Checking BeachDailyScore for ${beachId} on ${dateStr}`);

  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beachId: beachId,
      date: {
        gte: date,
        lte: endDate
      }
    }
  });

  console.log(`📊 Found ${scores.length} score records.`);
  scores.forEach(s => {
    console.log(`  - Source: ${s.source}, Slot: ${s.timeSlot}, Score: ${s.score}, Conditions: ${s.conditions ? "Present" : "Missing"}`);
    if (s.conditions) {
        console.log(`    Conditions: ${JSON.stringify(s.conditions).substring(0, 100)}...`);
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
