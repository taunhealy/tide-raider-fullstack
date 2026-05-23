import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("=== Querying Forecasts for WINDY ===");
  const forecasts = await prisma.forecast.findMany({
    where: {
      source: 'WINDY'
    },
    orderBy: {
      date: 'asc'
    }
  });

  console.log(`Total WINDY forecasts in Forecast table: ${forecasts.length}`);
  forecasts.forEach(f => {
    console.log(`Date: ${f.date.toISOString()} | Slot: ${f.timeSlot} | Wind: ${f.windSpeed}kt@${f.windDirection}° | Swell: ${f.swellHeight}m@${f.swellDirection}°`);
  });

  console.log("=== Querying BeachDailyScore counts for WINDY ===");
  const scoreCount = await prisma.beachDailyScore.count({
    where: { source: 'WINDY' }
  });
  console.log(`Total WINDY scores: ${scoreCount}`);
  
  const uniqueScoreDates = await prisma.beachDailyScore.groupBy({
    by: ['date'],
    where: { source: 'WINDY' },
    _count: true
  });
  console.log("WINDY Scores by Date:", uniqueScoreDates);
}

main().catch(console.error).finally(() => prisma.$disconnect());
