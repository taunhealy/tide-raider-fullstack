import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWindfinderForecast() {
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

  console.log('Windfinder Morning Forecast:', JSON.stringify(forecast, null, 2));
}

checkWindfinderForecast()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
