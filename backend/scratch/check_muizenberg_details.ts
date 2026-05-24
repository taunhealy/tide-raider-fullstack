import { prisma } from "../src/lib/prisma";

async function main() {
  const targetDate = new Date("2026-05-24");
  targetDate.setUTCHours(0, 0, 0, 0);

  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beachId: "muizenberg-beach",
      date: targetDate,
    },
    orderBy: { timeSlot: "asc" }
  });

  console.log("\n--- STORED SCORES WITH CATEGORIES ---");
  for (const s of scores) {
    console.log(`Source: ${s.source} | Category: ${s.category} | Slot: ${s.timeSlot} | Score: ${s.score} | Rating: ${s.starRating} stars`);
    console.log("Conditions Details:", JSON.stringify(s.conditions, null, 2));
    console.log("-----------------------------------------");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
