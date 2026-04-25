const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getLogs() {
  try {
    const logs = await prisma.logEntry.findMany({
      where: {
        date: new Date('2026-04-24'),
        beach: { name: 'Glencairn' }
      },
      include: { forecast: true }
    });
    console.log(JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

getLogs();
