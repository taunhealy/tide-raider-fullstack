
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- BeachDailyScores for Muizenberg ---');
  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beachId: 'muizenberg'
    },
    orderBy: {
      date: 'desc'
    },
    take: 10
  });

  scores.forEach(s => {
    console.log(`Date: ${s.date.toISOString()}, Slot: ${s.timeSlot}, Rating: ${s.starRating}, Score: ${s.score}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
