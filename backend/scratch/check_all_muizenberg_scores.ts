
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- ALL BeachDailyScores for Muizenberg ---');
  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beachId: 'muizenberg'
    },
    orderBy: {
      date: 'desc'
    }
  });

  console.log(`Found ${scores.length} scores.`);
  scores.forEach(s => {
    console.log(`Date: ${s.date.toISOString()}, Slot: ${s.timeSlot}, Rating: ${s.starRating}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
