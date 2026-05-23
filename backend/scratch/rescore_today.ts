import { prisma } from "../src/lib/prisma";
import { ScoreService } from "../src/services/scoreService";

async function main() {
  console.log("🌊 Starting score recalculation for today's forecasts in Western Cape...");

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Fetch all forecasts for today in western-cape
    const forecasts = await prisma.forecast.findMany({
      where: {
        regionId: "western-cape",
        date: today
      }
    });

    console.log(`🔍 Found ${forecasts.length} forecasts for today in the database.`);

    let recalculatedCount = 0;
    for (const f of forecasts) {
      console.log(`⭐ Recalculating scores for source: ${f.source}, slot: ${f.timeSlot}...`);
      await ScoreService.calculateAndStoreScores("western-cape", {
        windSpeed: f.windSpeed,
        windDirection: f.windDirection,
        swellHeight: f.swellHeight,
        swellPeriod: f.swellPeriod,
        swellDirection: f.swellDirection,
        date: f.date,
        source: f.source,
        timeSlot: f.timeSlot
      });
      recalculatedCount++;
    }

    console.log(`🎉 Successfully recalculated and stored scores for ${recalculatedCount} forecast slots!`);
  } catch (error) {
    console.error("❌ Error recalculating scores:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
