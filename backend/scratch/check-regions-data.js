
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const regions = await prisma.forecast.groupBy({
    by: ['regionId'],
    where: {
      date: {
        gte: new Date('2026-05-01')
      }
    },
    _count: {
      _all: true
    }
  });
  console.log('Regions with data in May 2026:', JSON.stringify(regions, null, 2));

  // Get region names too
  const regionNames = await prisma.region.findMany({
    where: {
      id: {
        in: regions.map(r => r.regionId)
      }
    },
    select: {
      id: true,
      name: true
    }
  });
  console.log('Region names:', JSON.stringify(regionNames, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
