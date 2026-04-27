const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const regionId = 'western-cape';
    const targetDate = new Date();
    targetDate.setUTCHours(0, 0, 0, 0);
    const dataMappingSource = 'WINDFINDER';
    const timeSlotParam = 'MORNING';

    const count = await prisma.beachDailyScore.count({
          where: {
            regionId: regionId,
            date: targetDate,
            source: dataMappingSource,
            timeSlot: timeSlotParam,
            score: { gte: 8 },
            beach: {
              isHiddenGem: true
            }
          }
        });
    console.log("Count:", count);

    const beaches = await prisma.beach.findMany({
          where: { regionId: regionId },
          include: {
            region: true,
            beachDailyScores: {
              where: {
                date: targetDate,
                source: dataMappingSource,
                timeSlot: timeSlotParam,
              },
              select: {
                score: true,
                conditions: true,
                date: true,
                timeSlot: true,
              },
            },
            logEntries: {
              where: { isPrivate: false, isAnonymous: false },
              orderBy: { date: 'desc' },
              take: 1,
              select: {
                id: true,
                date: true,
                surferRating: true,
                comments: true,
                imageUrl: true,
                surferName: true
              }
            }
          },
        });
    console.log("Beaches length:", beaches.length);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
