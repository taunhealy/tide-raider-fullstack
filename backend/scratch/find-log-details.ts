import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const id = "4b2f0558-abf2-4111-9c37-7b3025983c9a";
  const log = await prisma.logEntry.findUnique({
    where: { id },
    include: {
      beach: true,
      region: true
    }
  });

  if (!log) {
    console.log(`❌ Log with ID ${id} not found in database!`);
    return;
  }

  console.log("📝 Log entry found:");
  console.log(JSON.stringify(log, null, 2));

  if (log.beachId) {
    console.log("\n🏖️ Associated Beach details:");
    const beach = await prisma.beach.findUnique({
      where: { id: log.beachId },
      include: { region: true }
    });
    console.log(JSON.stringify(beach, null, 2));

    const dateStr = log.date instanceof Date ? log.date.toISOString().split("T")[0] : String(log.date).split("T")[0];
    console.log(`\n📅 Checking BeachDailyScores for date ${dateStr} and beachId ${log.beachId}:`);
    const targetDate = new Date(dateStr);
    const endDate = new Date(dateStr);
    endDate.setUTCHours(23, 59, 59, 999);

    const scores = await prisma.beachDailyScore.findMany({
      where: {
        beachId: log.beachId,
        date: {
          gte: targetDate,
          lte: endDate
        }
      }
    });
    console.log(`Found ${scores.length} scores:`);
    scores.forEach(s => {
      console.log(`  Source: ${s.source}, TimeSlot: ${s.timeSlot}, Score: ${s.score}, StarRating: ${s.starRating}`);
    });

    console.log(`\n🌊 Checking Forecasts for region ${log.regionId || beach?.regionId} and date ${dateStr}:`);
    const forecasts = await prisma.forecast.findMany({
      where: {
        regionId: log.regionId || beach?.regionId,
        date: targetDate
      }
    });
    console.log(`Found ${forecasts.length} forecasts:`);
    forecasts.forEach(f => {
      console.log(`  Source: ${f.source}, TimeSlot: ${f.timeSlot}, WindSpeed: ${f.windSpeed}, SwellHeight: ${f.swellHeight}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
