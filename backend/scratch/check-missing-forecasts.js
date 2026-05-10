
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.logEntry.count({ where: { forecastId: null } });
  console.log('Entries missing forecast:', count);

  const entriesWithMissing = await prisma.logEntry.findMany({
    where: { forecastId: null },
    take: 5,
    select: {
      id: true,
      beachName: true,
      date: true,
      regionId: true,
      surfTimeSlot: true
    }
  });
  console.log('Sample entries with missing forecast:', JSON.stringify(entriesWithMissing, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
