
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkScores() {
  const scores = await prisma.beachDailyScore.findMany({
    take: 10,
    orderBy: { date: 'desc' }
  });
  console.log("Recent Scores:", JSON.stringify(scores, null, 2));
  await prisma.$disconnect();
}

checkScores().catch(console.error);
