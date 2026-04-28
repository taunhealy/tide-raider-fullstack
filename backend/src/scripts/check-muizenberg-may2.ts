import { PrismaClient } from '@prisma/client';
import { ScoreService } from '../services/scoreService';

const prisma = new PrismaClient({ log: [] });

async function main() {
  const date = new Date('2026-05-02T00:00:00Z');
  const regionId = 'western-cape';

  // Get Muizenberg
  const muizenberg = await prisma.beach.findFirst({
    where: { name: { contains: 'Muizenberg', mode: 'insensitive' } },
    include: { conditionProfiles: true }
  });
  if (!muizenberg) { console.log("Beach not found"); return; }

  console.log("\n=== Muizenberg Condition Profile ===");
  console.log(JSON.stringify(muizenberg.conditionProfiles, null, 2));

  // Get forecasts for May 2
  const forecasts = await prisma.forecast.findMany({
    where: { regionId, date }
  });
  console.log(`\n=== Forecasts for May 2 (${forecasts.length} found) ===`);
  forecasts.forEach(f => {
    console.log(`[${f.source}/${f.timeSlot}] wind=${f.windSpeed}kts@${f.windDirection}° swell=${f.swellHeight}m@${f.swellPeriod}s dir=${f.swellDirection}° tide="${f.tide}"`);
  });

  // Get existing stored scores
  const scores = await prisma.beachDailyScore.findMany({
    where: { beachId: muizenberg.id, date }
  });
  console.log(`\n=== Stored Scores for May 2 (${scores.length} entries) ===`);
  scores.forEach(s => {
    console.log(`[${s.source}/${s.timeSlot}] score=${s.score} starRating=${s.starRating} createdAt=${s.createdAt.toISOString()}`);
    console.log(`  conditions: ${JSON.stringify(s.conditions)}`);
  });

  // Recalculate what the score SHOULD be with fresh forecast
  if (forecasts.length > 0 && muizenberg.conditionProfiles.length > 0) {
    const profile = muizenberg.conditionProfiles.find((p: any) => p.category === 'GENERAL');
    if (profile) {
      console.log("\n=== Fresh Score Calculation ===");
      forecasts.forEach(f => {
        const score = ScoreService.calculateScore(muizenberg, profile, f as any);
        console.log(`[${f.source}/${f.timeSlot}] fresh score = ${score}`);
      });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
