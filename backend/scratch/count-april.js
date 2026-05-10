
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.forecast.count({
    where: {
      date: {
        gte: new Date('2026-04-01T00:00:00Z'),
        lt: new Date('2026-05-01T00:00:00Z')
      }
    }
  });
  console.log('Total forecasts for April 2026:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
