const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRatings() {
  try {
    const logs = await prisma.logEntry.findMany({
      take: 5,
      select: {
        id: true,
        beachName: true,
        surferRating: true,
      },
      orderBy: {
        date: 'desc'
      }
    });

    console.log('--- RECENT LOG RATINGS ---');
    console.log(JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRatings();
