import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const count = await prisma.beachDailyScore.count({
    where: { date: today }
  });
  
  const latest = await prisma.beachDailyScore.findFirst({
    orderBy: { createdAt: "desc" },
    select: { date: true, createdAt: true, beachId: true, score: true }
  });
  
  console.log(`Today: ${today.toISOString()}`);
  console.log(`Scores for today: ${count}`);
  console.log(`Latest score in DB:`, latest);
  
  await prisma.$disconnect();
}

check();
