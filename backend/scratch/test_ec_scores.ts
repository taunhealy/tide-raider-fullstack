import { prisma } from '../src/lib/prisma';

async function testEC() {
  const targetDate = new Date(Date.UTC(2026, 6 - 1, 5, 0, 0, 0, 0)); // June 5, 2026
  
  const sources = ["WINDFINDER", "WINDFINDER_SUPER", "WINDGURU", "WINDY", "TIDE_RAIDER", "OPENMETEO_ARCHIVE"];

  console.log("Checking Eastern Cape scores for today:");
  for (const source of sources) {
    const beaches = await prisma.beach.findMany({
      where: {
        regionId: "eastern-cape"
      },
      select: {
        id: true,
        beachDailyScores: {
          where: {
            date: targetDate,
            source: source,
            category: "GENERAL"
          }
        }
      }
    });

    const withScores = beaches.filter(b => b.beachDailyScores.length > 0);
    console.log(`- Source: ${source}, beaches with scores: ${withScores.length} / ${beaches.length}`);
  }
}

testEC().catch(console.error).finally(() => prisma.$disconnect());
