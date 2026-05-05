
import { prisma } from "../src/lib/prisma";

async function check() {
  const sources = ["WINDFINDER", "WINDGURU", "WINDY"];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const source of sources) {
    const count = await prisma.forecast.count({
      where: { source: source as any, date: today }
    });
    console.log(`${source}: ${count} forecasts today`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
