import { ScoreService } from '../src/services/scoreService';
import { prisma } from '../src/lib/prisma';

async function main() {
  const regionId = 'western-cape';
  console.log(`Recalculating scores for ${regionId} for the next 10 days...`);

  for (let i = 0; i < 11; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + i);
    targetDate.setUTCHours(0, 0, 0, 0);

    const forecasts = await prisma.forecast.findMany({
      where: {
        regionId,
        date: targetDate,
      },
    });

    console.log(`--- Day ${i}: ${targetDate.toISOString().split('T')[0]} ---`);
    console.log(`Found ${forecasts.length} forecasts`);

    for (const forecast of forecasts) {
      console.log(`Calculating scores for ${forecast.source} - ${forecast.timeSlot}...`);
      await ScoreService.calculateAndStoreScores(regionId, forecast as any);
    }
  }

  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
