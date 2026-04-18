import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const regionId = 'western-cape';
  const sourceParam = 'WINDFINDER';
  
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const targetDate = date;

  console.log(`Searching for: regionId=${regionId}, source=${sourceParam}, date=${targetDate.toISOString()}`);

  const forecast = await prisma.forecast.findUnique({
    where: {
      date_regionId_source: {
        date: targetDate,
        regionId: regionId,
        source: sourceParam as any,
      },
    },
  });

  if (forecast) {
    console.log("✅ Forecast found!");
    console.log(JSON.stringify(forecast, null, 2));
  } else {
    console.log("❌ Forecast NOT found!");
    
    // Try findFirst with just the date and region
    const others = await prisma.forecast.findMany({
      where: {
        regionId: regionId,
        date: targetDate
      }
    });
    console.log(`Found ${others.length} other forecasts for this region/date:`, 
      others.map(o => o.source).join(', '));
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
