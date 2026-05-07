import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkElandsBayTomorrow() {
  const beachId = 'elands-bay-the-point';
  const tomorrow = new Date('2026-05-08');
  tomorrow.setUTCHours(0,0,0,0);
  
  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beachId: beachId,
      date: tomorrow
    }
  });

  console.log('Elands Bay Scores for Tomorrow:', JSON.stringify(scores, null, 2));
}

checkElandsBayTomorrow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
