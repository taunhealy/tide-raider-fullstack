import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Connecting to DB and checking forecasts...");
  try {
    const totalRegions = await prisma.region.count();
    console.log(`Total regions in DB: ${totalRegions}`);

    const totalForecasts = await prisma.forecast.count();
    console.log(`Total forecast records in DB: ${totalForecasts}`);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dateStr = today.toISOString().split("T")[0];
    
    console.log(`Today's normalized UTC date: ${dateStr}`);

    const todayForecasts = await prisma.forecast.findMany({
      where: {
        date: today
      },
      select: {
        id: true,
        regionId: true,
        source: true,
        timeSlot: true,
        date: true
      }
    });

    console.log(`Today's forecasts in DB: ${todayForecasts.length}`);
    todayForecasts.forEach(f => {
      console.log(`  Region: ${f.regionId}, Source: ${f.source}, Slot: ${f.timeSlot}`);
    });

    const recentForecasts = await prisma.forecast.findMany({
      take: 10,
      orderBy: { date: "desc" },
      select: {
        regionId: true,
        source: true,
        timeSlot: true,
        date: true
      }
    });
    console.log("\nMost recent forecast dates in DB:");
    recentForecasts.forEach(f => {
      console.log(`  Date: ${f.date.toISOString().split("T")[0]}, Region: ${f.regionId}, Source: ${f.source}, Slot: ${f.timeSlot}`);
    });

  } catch (e: any) {
    console.error("❌ Error querying DB:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
