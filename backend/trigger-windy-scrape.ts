import { getLatestConditions } from './src/services/surfConditionsService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const beachId = 'llandudno';
  const beach = await prisma.beach.findUnique({ where: { id: beachId } });
  
  if (!beach) {
    console.error('Beach not found');
    return;
  }

  console.log('🔄 Triggering fresh WINDY scrape for Llandudno...');
  // Force refresh Windy for the next 7 days
  const result = await getLatestConditions(
    beach.regionId,
    true, // forceRefresh
    'WINDY',
    7
  );

  console.log('✅ Scrape complete. Checking Swell 2 presence...');
  const updated = await prisma.forecast.findFirst({
    where: {
      regionId: beach.regionId,
      source: 'WINDY',
      swellHeight2: { gt: 0 }
    }
  });

  if (updated) {
    console.log('🚀 SUCCESS: Swell 2 data detected in database!');
    console.log(`Date: ${updated.date.toISOString()}, S2: ${updated.swellHeight2}m`);
  } else {
    console.log('⚠️ Scrape finished but Swell 2 is still 0. This might be because the actual forecast has no secondary swell today.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
