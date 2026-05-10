
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.forecast.count({
    where: {
      date: {
        gte: new Date('2026-05-05T00:00:00Z'),
        lt: new Date('2026-05-06T00:00:00Z')
      }
    }
  });
  console.log('Total forecasts for 2026-05-05:', count);

  // Check a sample to see what the dates look like
  const samples = await prisma.forecast.findMany({
    take: 5,
    orderBy: { date: 'desc' },
    select: { date: true, regionId: true, source: true }
  });
  console.log('Sample forecast dates:', JSON.stringify(samples, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
