
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.logEntry.findMany({
    where: {
      date: new Date('2026-05-09'),
      forecastId: null
    },
    select: {
      id: true,
      beachName: true,
      mostAccurateSource: true,
      surfTimeSlot: true
    }
  });
  console.log('Entries for 2026-05-09 missing forecast:', JSON.stringify(entries, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
