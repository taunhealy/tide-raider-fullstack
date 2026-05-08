
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkLlandudnoSources() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beachId: "llandudno",
      date: today
    },
    select: {
      source: true,
      timeSlot: true,
      score: true,
      conditions: true
    }
  });

  console.log(`Sources found for Llandudno on ${today.toISOString()}:`, JSON.stringify(scores, null, 2));
  await prisma.$disconnect();
}

checkLlandudnoSources().catch(console.error);
