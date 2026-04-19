import { getLatestConditions } from '../src/services/surfConditionsService';
import { prisma } from '../src/lib/prisma';

async function main() {
  const result = await getLatestConditions('western-cape', true, 'WINDFINDER');
  console.log('Final Result:', JSON.stringify(result, null, 2));

  const dbCheck = await prisma.forecast.findMany({
    where: {
      regionId: 'western-cape',
      date: new Date('2026-04-19T00:00:00Z'),
    },
    orderBy: { timeSlot: 'asc' }
  });
  console.log('DB Records for today:', JSON.stringify(dbCheck, null, 2));
}

main().catch(console.error);
