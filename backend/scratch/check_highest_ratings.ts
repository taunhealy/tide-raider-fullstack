import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkHighest() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const sources = ["WINDFINDER", "WINDFINDER_SUPER", "WINDGURU", "WINDY", "TIDE_RAIDER"];
  
  console.log(`Checking highest starRating for today (${today.toISOString().split("T")[0]}):`);

  for (const source of sources) {
    const maxScore = await prisma.beachDailyScore.findFirst({
      where: {
        date: today,
        source: source as any,
        category: "GENERAL"
      },
      orderBy: {
        starRating: "desc"
      },
      select: {
        starRating: true,
        beachId: true
      }
    });

    const countOnes = await prisma.beachDailyScore.count({
      where: {
        date: today,
        source: source as any,
        category: "GENERAL",
        starRating: 1
      }
    });

    const totalCount = await prisma.beachDailyScore.count({
      where: {
        date: today,
        source: source as any,
        category: "GENERAL"
      }
    });

    console.log(`- Source: ${source.padEnd(18)}: Max Rating = ${maxScore?.starRating ?? "N/A"} (on ${maxScore?.beachId || "N/A"}), count of rating=1: ${countOnes} / ${totalCount}`);
  }
}

checkHighest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
