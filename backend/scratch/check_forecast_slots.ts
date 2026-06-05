import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSlots() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const sources = ["WINDGURU", "WINDY"];
  const regionId = "western-cape";

  for (const source of sources) {
    console.log(`\n=== Source: ${source} ===`);
    const forecasts = await prisma.forecast.findMany({
      where: {
        regionId,
        date: today,
        source: source as any
      },
      select: {
        id: true,
        timeSlot: true,
        windSpeed: true,
        swellHeight: true
      }
    });

    console.log(`Forecasts found for today: ${forecasts.length}`);
    forecasts.forEach(f => {
      console.log(`  - ID: ${f.id}, Slot: ${f.timeSlot}, Wind Speed: ${f.windSpeed}, Swell Height: ${f.swellHeight}`);
    });
  }
}

checkSlots()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
