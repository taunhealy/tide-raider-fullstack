import { ScoreService } from "../src/services/scoreService";
import { prisma } from "../src/lib/prisma";

async function main() {
  const regionId = "western-cape";
  const beachId = "muizenberg-beach";
  const source = "WINDFINDER";
  
  // Set date to beginning of today in UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Get upcoming forecasts
  const forecasts = await prisma.forecast.findMany({
    where: {
      regionId,
      source: source as any,
      date: { gte: today }
    },
    orderBy: [
      { date: 'asc' },
      { timeSlot: 'asc' }
    ]
  });

  console.log(`Found ${forecasts.length} upcoming forecasts for ${regionId} (${source})`);

  if (forecasts.length === 0) {
    console.warn("No upcoming forecasts found. Check if they were scraped correctly.");
    return;
  }

  for (const forecast of forecasts) {
    console.log(`Recalculating for ${forecast.date.toISOString().split('T')[0]} ${forecast.timeSlot}...`);
    try {
      await ScoreService.calculateAndStoreScores(regionId, {
        windSpeed: forecast.windSpeed,
        windDirection: forecast.windDirection,
        swellHeight: forecast.swellHeight,
        swellDirection: forecast.swellDirection,
        swellPeriod: forecast.swellPeriod,
        date: forecast.date,
        source: forecast.source as any,
        timeSlot: forecast.timeSlot as any
      });
    } catch (err) {
      console.error(`Failed to calculate scores for ${forecast.date}:`, err);
    }
  }

  // Check results for Muizenberg
  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beachId,
      source: source as any,
      date: { gte: today }
    },
    orderBy: [
      { date: 'asc' },
      { timeSlot: 'asc' }
    ]
  });

  console.log("\n--- Results for Muizenberg ---");
  if (scores.length === 0) {
    console.log("No scores found for Muizenberg in the upcoming days.");
  } else {
    scores.forEach(s => {
      console.log(`${s.date.toISOString().split('T')[0]} ${s.timeSlot}: Score ${s.score} (${s.starRating} stars)`);
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
