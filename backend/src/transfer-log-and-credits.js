const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function transferLogAndCredits() {
  try {
    const tideRaiderId = 'cmnhjq35d000cs60fxss02p4o';
    const logId = '68561cf3-0e31-4252-a3c2-bc04ab70230c';

    // 1. Update Log Ownership
    const updatedLog = await prisma.logEntry.update({
      where: { id: logId },
      data: { userId: tideRaiderId }
    });
    console.log(`✅ Transferred Glencairn log (${logId}) to Tide Raider user.`);

    // 2. Update Credits
    const updatedUser = await prisma.user.update({
      where: { id: tideRaiderId },
      data: { credits: 300 }
    });
    console.log(`✅ Updated Tide Raider user credits to ${updatedUser.credits}.`);

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

transferLogAndCredits();
