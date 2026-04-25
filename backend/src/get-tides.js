const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getTides() {
  try {
    const forecasts = await prisma.forecast.findMany({
      where: { tide: { not: null } },
      take: 20
    });
    console.log(JSON.stringify(forecasts.map(f => f.tide), null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

getTides();
