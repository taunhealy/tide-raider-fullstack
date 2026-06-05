import { prisma } from '../src/lib/prisma';

async function testQuery() {
  const targetDate = new Date(Date.UTC(2026, 6 - 1, 5, 0, 0, 0, 0)); // June 5, 2026
  console.log(`Target date (UTC): ${targetDate.toISOString()}`);

  const sources = ["WINDFINDER", "WINDFINDER_SUPER", "WINDGURU", "WINDY", "TIDE_RAIDER", "OPENMETEO_ARCHIVE"];

  for (const source of sources) {
    const beaches = await prisma.beach.findMany({
      where: {
        regionId: "western-cape"
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

testQuery().catch(console.error).finally(() => prisma.$disconnect());
