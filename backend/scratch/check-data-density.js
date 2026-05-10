
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const counts = await prisma.forecast.groupBy({
    by: ['date'],
    where: {
      regionId: 'western-cape',
      date: {
        gte: new Date('2026-05-01')
      }
    },
    _count: {
      _all: true
    },
    orderBy: {
      date: 'asc'
    }
  });
  console.log('Western Cape forecast counts by date:', JSON.stringify(counts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
