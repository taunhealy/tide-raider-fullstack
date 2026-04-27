import { PrismaClient } from '@prisma/client';
import { ScoreService } from '../services/scoreService';

const prisma = new PrismaClient();

async function main() {
  const tomorrow = new Date('2026-04-28T00:00:00Z');
  const regionId = 'western-cape';
  
  // Find all forecasts for tomorrow in western-cape
  const forecasts = await prisma.forecast.findMany({
    where: {
      regionId,
      date: tomorrow
    }
  });

  console.log(`Found ${forecasts.length} forecasts to recalculate scores for.`);

  for (const forecast of forecasts) {
    console.log(`Recalculating for ${forecast.source} - ${forecast.timeSlot}...`);
    await ScoreService.calculateAndStoreScores(regionId, {
      ...forecast,
      date: tomorrow,
      timeSlot: forecast.timeSlot as any,
    });
  }
  
  console.log("Recalculation complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
