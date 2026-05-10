
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const forecasts = await prisma.forecast.findMany({
    where: {
      regionId: 'western-cape',
      date: new Date('2026-05-09'),
      timeSlot: 'NOON'
    },
    select: {
      source: true,
      id: true
    }
  });
  console.log('Available forecasts for yesterday NOON:', JSON.stringify(forecasts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
