const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.beach.count();
    console.log('BEACH_COUNT:', count);
    const scoreCount = await prisma.beachDailyScore.count();
    console.log('SCORE_COUNT:', scoreCount);
  } catch (e) {
    console.error('ERROR_CHECKING_DB:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
