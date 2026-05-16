
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking all BeachDailyScores ---');
  const scores = await prisma.beachDailyScore.findMany({
    orderBy: {
      date: 'desc'
    },
    take: 20
  });

  scores.forEach(s => {
    console.log(`Beach: ${s.beachId}, Date: ${s.date.toISOString()}, Slot: ${s.timeSlot}, Rating: ${s.starRating}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
