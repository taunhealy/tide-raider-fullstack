import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("=== Inspecting WINDGURU Forecast Records for Western Cape ===");
  const forecasts = await prisma.forecast.findMany({
    where: {
      source: 'WINDGURU',
      regionId: 'western-cape'
    },
    orderBy: {
      date: 'asc'
    }
  });

  console.log(`Found ${forecasts.length} Windguru records.`);
  
  // Filter for Mon, May 25, 2026
  const targetDate = new Date('2026-05-25T00:00:00.000Z');
  
  const mondayForecasts = forecasts.filter(f => f.date.toISOString().split('T')[0] === '2026-05-25');
  console.log(`\nMonday, May 25, 2026 Windguru forecasts (${mondayForecasts.length} found):`);
  mondayForecasts.forEach(f => {
    console.log(`Slot: ${f.timeSlot} | Wind: ${f.windSpeed}kt@${f.windDirection}° | Swell: ${f.swellHeight}m@${f.swellDirection}° | Period: ${f.swellPeriod}s`);
  });

  console.log("\n=== Stored BeachDailyScore counts for WINDGURU on Monday, May 25 ===");
  const scoreCount = await prisma.beachDailyScore.count({
    where: {
      source: 'WINDGURU',
      regionId: 'western-cape',
      date: targetDate
    }
  });
  console.log(`Total scores for Monday: ${scoreCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
