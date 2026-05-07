import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSpecificScore() {
  const tomorrow = new Date('2026-05-08');
  tomorrow.setUTCHours(0,0,0,0);
  
  const score = await prisma.beachDailyScore.findUnique({
    where: {
      beachId_date_source_timeSlot_category: {
        beachId: 'elands-bay-the-point',
        date: tomorrow,
        source: 'WINDFINDER',
        timeSlot: 'MORNING',
        category: 'GENERAL'
      }
    }
  });

  console.log('Specific Beach Score:', JSON.stringify(score, null, 2));
}

checkSpecificScore()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
