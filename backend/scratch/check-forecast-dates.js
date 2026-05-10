
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dates = await prisma.forecast.groupBy({
    by: ['date'],
    where: {
      regionId: 'western-cape'
    },
    orderBy: {
      date: 'desc'
    },
    take: 10
  });
  console.log('Latest dates for Western Cape forecasts:', JSON.stringify(dates, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
