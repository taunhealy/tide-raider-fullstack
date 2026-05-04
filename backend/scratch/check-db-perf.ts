import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const beachCount = await prisma.beach.count();
    const scoreCount = await prisma.beachDailyScore.count();
    console.log(`Beaches: ${beachCount}`);
    console.log(`Scores: ${scoreCount}`);
    
    const startTime = Date.now();
    const beaches = await prisma.beach.findMany({
      take: 10,
      include: {
        beachDailyScores: {
          take: 5
        }
      }
    });
    const endTime = Date.now();
    console.log(`Small query time: ${endTime - startTime}ms`);
    
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
