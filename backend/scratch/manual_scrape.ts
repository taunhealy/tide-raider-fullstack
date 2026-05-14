import { fetchAllRegionsData } from '../src/services/regionDataService';
import { prisma } from '../src/lib/prisma';

async function triggerScrape() {
  console.log('🚀 Triggering manual scrape for western-cape...');
  // Force refresh and use 7 days limit
  const result = await fetchAllRegionsData(7, ['western-cape'], true);
  console.log('✅ Scrape result:', JSON.stringify(result, null, 2));
}

triggerScrape().catch(console.error).finally(() => prisma.$disconnect());
