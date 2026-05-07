import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkForecastAndScore() {
  const tomorrow = new Date('2026-05-08');
  tomorrow.setUTCHours(0,0,0,0);
  
  const forecast = await prisma.forecast.findUnique({
    where: {
      date_regionId_source_timeSlot: {
        date: tomorrow,
        regionId: 'western-cape',
        source: 'WINDFINDER',
        timeSlot: 'MORNING'
      }
    }
  });

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

  console.log('Forecast:', JSON.stringify(forecast, null, 2));
  console.log('Score:', JSON.stringify(score, null, 2));
}

checkForecastAndScore()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
