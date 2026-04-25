const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAllForecasts() {
  try {
    const forecasts = await prisma.forecast.findMany({
      where: {
        date: new Date('2026-04-24'),
        regionId: 'western-cape'
      }
    });
    console.log(JSON.stringify(forecasts, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

getAllForecasts();
