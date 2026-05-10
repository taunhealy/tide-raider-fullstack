
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.forecast.count({
    where: {
      regionId: 'western-cape',
      date: new Date('2026-05-05')
    }
  });
  console.log('Forecasts for 2026-05-05 in Western Cape:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
