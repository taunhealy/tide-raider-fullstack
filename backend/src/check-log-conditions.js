const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLogConditions() {
  try {
    const logs = await prisma.logEntry.findMany({
      take: 10,
      select: {
        id: true,
        beachName: true,
        forecastId: true,
        forecast: {
          select: {
            windSpeed: true,
            swellHeight: true,
            swellPeriod: true,
          }
        }
      }
    });

    console.log(JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogConditions();
