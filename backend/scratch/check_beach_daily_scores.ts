import { prisma } from '../src/lib/prisma';

async function check() {
  const today = new Date('2026-06-05T00:00:00.000Z');
  
  const sampleScores = await prisma.beachDailyScore.findMany({
    where: {
      date: today
    },
    take: 5,
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      source: true,
      createdAt: true,
      updatedAt: true
    }
  });

  console.log("Sample scores for today (2026-06-05):");
  console.log(JSON.stringify(sampleScores, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
