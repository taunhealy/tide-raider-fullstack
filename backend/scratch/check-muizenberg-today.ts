import { PrismaClient } from '@prisma/client';
import { ScoreService } from '../services/scoreService';

const prisma = new PrismaClient({ log: [] });

async function main() {
  const date = new Date('2026-05-09T00:00:00Z');
  const regionId = 'western-cape';

  // Get Muizenberg
  const muizenberg = await prisma.beach.findFirst({
    where: { name: { contains: 'Muizenberg', mode: 'insensitive' } },
    include: { conditionProfiles: true }
  });
  if (!muizenberg) { console.log("Beach not found"); return; }

  console.log("\n=== Muizenberg Condition Profile ===");
  const profile = (muizenberg.conditionProfiles as any[]).find((p: any) => p.category === 'GENERAL');
  console.log(JSON.stringify(profile, null, 2));

  // Get forecasts for May 9
  const forecasts = await prisma.forecast.findMany({
    where: { regionId, date }
  });
  console.log(`\n=== Forecasts for May 9 (${forecasts.length} found) ===`);
  
  if (forecasts.length > 0 && profile) {
    forecasts.forEach(f => {
      const result = ScoreService.calculateScore(muizenberg, profile, f as any);
      console.log(`[${f.source}/${f.timeSlot}] wind=${f.windSpeed}kts@${f.windDirection}° swell=${f.swellHeight}m@${f.swellPeriod}s dir=${f.swellDirection}° -> Result:`, result);
    });
  } else {
    console.log("No forecasts found for today or profile missing.");
  }

  // Get stored scores for today
  const storedScores = await prisma.beachDailyScore.findMany({
    where: { beachId: muizenberg.id, date }
  });
  console.log(`\n=== Stored Scores for May 9 (${storedScores.length} entries) ===`);
  storedScores.forEach(s => {
    console.log(`[${s.source}/${s.timeSlot}] starRating=${s.starRating} score=${s.score}`);
    console.log(`  Deductions: ${JSON.stringify((s.conditions as any).deductions)}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
