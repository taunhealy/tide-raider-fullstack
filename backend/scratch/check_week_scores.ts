import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkWeekScores() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const sources = ["WINDFINDER", "WINDFINDER_SUPER", "WINDGURU", "WINDY", "TIDE_RAIDER"];
  const regions = ["western-cape", "eastern-cape"];

  console.log(`Checking daily scores starting from today (${today.toISOString().split("T")[0]}) for next 7 days:`);

  for (const regionId of regions) {
    console.log(`\n=== Region: ${regionId} ===`);
    const beaches = await prisma.beach.findMany({
      where: { regionId },
      select: { id: true }
    });
    const totalBeaches = beaches.length;

    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() + day);
      const dateStr = date.toISOString().split("T")[0];
      console.log(`  Date: ${dateStr}`);

      for (const source of sources) {
        const scoreCount = await prisma.beachDailyScore.count({
          where: {
            regionId,
            date,
            source: source as any,
            category: "GENERAL"
          }
        });
        console.log(`    - Source: ${source.padEnd(18)}: ${scoreCount} / ${totalBeaches * 2} slots (Morning/Noon)`);
      }
    }
  }
}

checkWeekScores()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
