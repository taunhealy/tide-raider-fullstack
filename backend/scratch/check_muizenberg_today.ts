import { prisma } from "../src/lib/prisma";

async function main() {
  const targetDate = new Date("2026-05-24");
  targetDate.setUTCHours(0, 0, 0, 0);

  console.log("Checking Muizenberg forecast and score data for:", targetDate.toISOString());

  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beachId: "muizenberg-beach",
      date: targetDate,
    },
    orderBy: { timeSlot: "asc" }
  });

  console.log("\n--- STORED SCORES ---");
  for (const s of scores) {
    console.log(`Source: ${s.source} | Slot: ${s.timeSlot} | Score: ${s.score} | StarRating: ${s.starRating} stars`);
    console.log("Deductions:", JSON.stringify(s.deductions));
  }

  const forecasts = await prisma.forecast.findMany({
    where: {
      regionId: "western-cape",
      date: targetDate,
    },
    orderBy: [
      { source: "asc" },
      { timeSlot: "asc" }
    ]
  });

  console.log("\n--- REGION FORECASTS ---");
  for (const f of forecasts) {
    console.log(`Source: ${f.source} | Slot: ${f.timeSlot} | Wind: ${f.windSpeed}kt ${f.windDirection} | Swell: ${f.swellHeight}m ${f.swellPeriod}s ${f.swellDirection}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
