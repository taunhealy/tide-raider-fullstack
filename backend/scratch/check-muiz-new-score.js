const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMuizScore() {
  try {
    const date = new Date('2026-05-12');
    date.setUTCHours(0, 0, 0, 0);

    const score = await prisma.beachDailyScore.findFirst({
      where: {
        beachId: 'muizenberg-beach',
        date: date,
        timeSlot: 'MORNING',
        source: 'WINDFINDER'
      }
    });

    if (score) {
      console.log("Score found for Muizenberg on May 12 (Morning):");
      console.log(JSON.stringify(score, null, 2));
    } else {
      console.log("Score not found yet.");
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMuizScore();
