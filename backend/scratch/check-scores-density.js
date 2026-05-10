
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.beachDailyScore.count({
    where: {
      date: {
        gte: new Date('2026-04-01T00:00:00Z')
      }
    }
  });
  console.log('Total BeachDailyScores from April 2026:', count);

  const samples = await prisma.beachDailyScore.findMany({
    take: 5,
    orderBy: { date: 'desc' },
    select: { date: true, beachId: true, source: true }
  });
  console.log('Sample scores:', JSON.stringify(samples, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
