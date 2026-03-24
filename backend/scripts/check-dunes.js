const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const entry = await prisma.logEntry.findFirst({
      where: {
        beachName: { contains: 'Dunes' }
      }
    });
    console.log('DUNES_LOG:' + JSON.stringify(entry, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
