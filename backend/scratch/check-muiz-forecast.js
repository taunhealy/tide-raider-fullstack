const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMuizenbergForecast() {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const forecasts = await prisma.forecast.findMany({
      where: {
        regionId: 'western-cape',
        date: today,
        source: 'WINDFINDER'
      },
      orderBy: {
        timeSlot: 'asc'
      }
    });

    console.log("Forecasts for Muizenberg (WINDFINDER) today:");
    console.log(JSON.stringify(forecasts, null, 2));

    const allSources = await prisma.forecast.findMany({
        where: {
          regionId: 'western-cape',
          date: today,
        },
        orderBy: {
          source: 'asc'
        }
      });
    
    console.log("\nAll forecasts for Muizenberg today:");
    console.log(JSON.stringify(allSources, null, 2));

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMuizenbergForecast();
