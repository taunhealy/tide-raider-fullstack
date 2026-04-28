import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const forecasts = await prisma.forecast.findMany({
    select: { tide: true },
    distinct: ['tide']
  });

  console.log('Distinct tide values in Forecast table:');
  console.log(forecasts);
  
  const today = new Date();
  const todayForecasts = await prisma.forecast.findMany({
    where: {
      date: {
        gte: new Date(today.setHours(0,0,0,0)),
        lt: new Date(today.setHours(23,59,59,999))
      }
    },
    select: { regionId: true, tide: true, id: true }
  });
  
  console.log('Today forecasts tide values:');
  console.log(todayForecasts.slice(0, 10)); // Just a sample
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
