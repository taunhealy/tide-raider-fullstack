import { prisma } from '../src/lib/prisma';

async function run() {
  try {
    const count = await prisma.region.count();
    console.log('Total regions count:', count);
    
    const regions = await prisma.region.findMany({
      take: 10,
      select: { id: true, name: true, countryId: true }
    });
    console.log('Sample regions:', regions);
  } catch (err) {
    console.error('Error fetching regions:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
