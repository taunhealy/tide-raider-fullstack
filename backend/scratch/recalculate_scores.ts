
import { prisma } from "../src/lib/prisma";
import { ScoreService } from "../src/services/scoreService";

async function main() {
  console.log("🚀 Recalculating scores for all beaches in Western Cape...");
  
  const regionId = "western-cape";
  
  // 1. Get all forecasts for the region from today onwards
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const forecasts = await prisma.forecast.findMany({
    where: {
      regionId,
      date: { gte: today }
    }
  });
  
  console.log(`Found ${forecasts.length} forecasts to process.`);
  
  for (const forecast of forecasts) {
    console.log(`Processing forecast for ${forecast.date.toISOString().split('T')[0]} [${forecast.source}] [${forecast.timeSlot}]`);
    
    try {
      await ScoreService.calculateAndStoreScores(regionId, {
        windSpeed: forecast.windSpeed,
        windDirection: forecast.windDirection,
        swellHeight: forecast.swellHeight,
        swellDirection: forecast.swellDirection,
        swellPeriod: forecast.swellPeriod,
        date: forecast.date,
        source: forecast.source,
        timeSlot: forecast.timeSlot
      });
    } catch (error) {
      console.error(`Failed for forecast ${forecast.id}:`, error);
    }
  }
  
  console.log("✅ Done! Scores updated for all beaches in Western Cape.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
