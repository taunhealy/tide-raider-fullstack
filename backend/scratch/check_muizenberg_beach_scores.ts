
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- BeachDailyScores for muizenberg-beach ---');
  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beachId: 'muizenberg-beach'
    },
    orderBy: {
      date: 'desc'
    },
    take: 10
  });

  scores.forEach(s => {
    console.log(`Date: ${s.date.toISOString()}, Slot: ${s.timeSlot}, Rating: ${s.starRating}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
