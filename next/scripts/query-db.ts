import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log("🔍 Checking Forecast Table for Western Cape on 2026-04-06...");
    
    const targetDate = new Date("2026-04-06T00:00:00Z");
    
    const forecasts = await prisma.forecast.findMany({
      where: {
        date: targetDate,
        regionId: 'western-cape'
      },
      select: { source: true, windSpeed: true, swellHeight: true },
    });

    console.log(`\n📊 Forecasts Found (${forecasts.length}):`);
    forecasts.forEach(f => {
      console.log(` - Source: ${f.source} (Wind: ${f.windSpeed}, Swell: ${f.swellHeight})`);
    });

    if (forecasts.length === 0) {
      console.log("\n⚠️ No forecast records found! Checking any available dates in Forecast table...");
      const availableDates = await prisma.forecast.findMany({
        distinct: ['date'],
        select: { date: true },
        take: 5,
        orderBy: { date: 'desc' }
      });
      availableDates.forEach(d => console.log(` - Available Date: ${d.date.toISOString().split('T')[0]}`));
    }

  } catch (error) {
    console.error("❌ Query Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
