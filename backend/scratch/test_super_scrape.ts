
import { getLatestConditions } from '../src/services/surfConditionsService';
import { prisma } from '../src/lib/prisma';

async function main() {
  const regionId = 'western-cape';
  console.log(`Triggering Superforecast scrape for ${regionId}...`);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  // Force refresh for Western Cape SUPERFORECAST
  const result = await getLatestConditions(
    regionId,
    true, // forceRefresh
    "WINDFINDER_SUPER",
    10,
    tomorrow
  );
  
  console.log('Superforecast result:', JSON.stringify({
    source: result?.source,
    date: result?.date,
    timeSlot: result?.timeSlot,
    wind: result?.windSpeed,
    swell: result?.swellHeight
  }, null, 2));

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
