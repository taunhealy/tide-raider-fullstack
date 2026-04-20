import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkForecasts() {
  const regionId = 'western-cape';
  console.log(`Checking forecasts for ${regionId}...`);
  
  const forecasts = await prisma.forecast.findMany({
    where: { regionId },
    select: {
      date: true,
      source: true,
      timeSlot: true,
    },
    orderBy: { date: 'asc' }
  });
  
  console.log(`Total forecasts found: ${forecasts.length}`);
  
  const summary = forecasts.reduce((acc: any, f: any) => {
    const d = f.date.toISOString().split('T')[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(`${f.source}:${f.timeSlot}`);
    return acc;
  }, {});
  
  console.log(JSON.stringify(summary, null, 2));
  
  await prisma.$disconnect();
}

checkForecasts().catch(console.error);
