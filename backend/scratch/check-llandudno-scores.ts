
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkLlandudno() {
  const beach = await prisma.beach.findFirst({
    where: { name: "Llandudno" }
  });
  
  if (!beach) {
    console.log("Llandudno not found");
    return;
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beachId: beach.id,
      date: today
    }
  });

  console.log(`Scores for ${beach.name} on ${today.toISOString()}:`, JSON.stringify(scores, null, 2));
  await prisma.$disconnect();
}

checkLlandudno().catch(console.error);
