const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getForecast() {
  try {
    const forecast = await prisma.forecast.findFirst({
      where: {
        date: new Date('2026-04-24'),
        regionId: 'western-cape',
        source: 'WINDFINDER',
        timeSlot: 'NOON'
      }
    });
    console.log(JSON.stringify(forecast, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

getForecast();
