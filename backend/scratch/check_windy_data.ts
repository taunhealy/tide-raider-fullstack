
import { prisma } from "../src/lib/prisma";

async function check() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const dates = [
    new Date(today),
    new Date(today),
    new Date(today)
  ];
  dates[1].setDate(dates[1].getDate() - 1);
  dates[2].setDate(dates[2].getDate() + 1);

  console.log("Checking WINDY data for today and adjacent days:");
  
  for (const d of dates) {
    const count = await prisma.forecast.count({
      where: { source: "WINDY", date: d }
    });
    console.log(`${d.toISOString().split('T')[0]}: ${count} forecasts`);
    
    const scoreCount = await prisma.beachDailyScore.count({
      where: { source: "WINDY", date: d }
    });
    console.log(`${d.toISOString().split('T')[0]}: ${scoreCount} scores`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
