/**
 * Deletes today's WINDFINDER forecasts for western-cape so the next scrape
 * re-ingests them with the corrected tide height (no longer polluted by wave period).
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: [] });

async function main() {
  const today = new Date('2026-04-28T00:00:00Z');
  const result = await prisma.forecast.deleteMany({
    where: { regionId: 'western-cape', date: today, source: 'WINDFINDER' }
  });
  console.log(`✅ Deleted ${result.count} stale WINDFINDER forecasts for Apr 28`);
  
  // Also clear any scores that used the bad tide data
  const scoreResult = await prisma.beachDailyScore.deleteMany({
    where: { regionId: 'western-cape', date: today, source: 'WINDFINDER' }
  });
  console.log(`✅ Cleared ${scoreResult.count} stale scores`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
