
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const score = await prisma.beachDailyScore.findFirst({
    where: {
      beachId: 'silversands-beach',
      date: new Date('2026-05-05')
    }
  });
  console.log('Score for Silversands on May 5th:', JSON.stringify(score, null, 2));

  const allSources = await prisma.beachDailyScore.findMany({
    where: {
      beachId: 'silversands-beach',
      date: new Date('2026-05-05')
    },
    select: { source: true, timeSlot: true }
  });
  console.log('All sources for Silversands on May 5th:', JSON.stringify(allSources, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
