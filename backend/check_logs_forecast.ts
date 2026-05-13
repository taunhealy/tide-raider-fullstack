import { prisma } from './src/lib/prisma';

async function test() {
  console.log('Fetching recent log entries...');
  
  try {
    const logs = await prisma.logEntry.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        forecast: true,
        beach: true
      }
    });

    for (const log of logs) {
      console.log(`Log ID: ${log.id}`);
      console.log(`  Beach: ${log.beachName}`);
      console.log(`  Date: ${log.date}`);
      console.log(`  Forecast ID: ${log.forecastId}`);
      console.log(`  Forecast Object: ${JSON.stringify(log.forecast)}`);
      
      if (!log.forecast) {
          // Try to find any forecast for this region and date
          const anyForecast = await prisma.forecast.findFirst({
              where: {
                  regionId: log.regionId,
                  date: log.date
              }
          });
          console.log(`  Manual Forecast Search: ${JSON.stringify(anyForecast)}`);
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
