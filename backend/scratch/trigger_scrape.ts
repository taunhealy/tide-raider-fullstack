import { fetchAllRegionsData } from '../src/services/regionDataService';
import { prisma } from '../src/lib/prisma';

async function main() {
  const regionId = 'western-cape';
  console.log(`Triggering fresh scrape for ${regionId}...`);

  // Force refresh for Western Cape
  const result = await fetchAllRegionsData(10, [regionId], true);
  console.log('Scrape result:', JSON.stringify(result, null, 2));

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
