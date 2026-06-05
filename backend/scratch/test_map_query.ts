import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testMapQuery() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  const sources = ["WINDGURU", "WINDY"];
  const regionId = "western-cape";

  for (const source of sources) {
    console.log(`\nQuerying for source: ${source}`);
    const beaches = await prisma.beach.findMany({
      where: { regionId },
      select: {
        id: true,
        name: true,
        beachDailyScores: {
          where: {
            date: { gte: today, lt: sevenDaysLater },
            source: source as any,
            category: "GENERAL"
          },
          select: {
            date: true,
            starRating: true,
            source: true,
            conditions: true
          }
        }
      },
      take: 2 // check a couple of beaches
    });

    for (const beach of beaches) {
      console.log(`  Beach: ${beach.name}`);
      console.log(`    Scores found: ${beach.beachDailyScores.length}`);
      if (beach.beachDailyScores.length > 0) {
        console.log(`    First Score:`, {
          date: beach.beachDailyScores[0].date.toISOString().split("T")[0],
          rating: beach.beachDailyScores[0].starRating,
          source: beach.beachDailyScores[0].source
        });
      }
    }
  }
}

testMapQuery()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
