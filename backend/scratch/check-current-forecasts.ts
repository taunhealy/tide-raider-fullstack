
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkForecasts() {
  const date = new Date("2026-05-08T00:00:00.000Z");
  
  console.log(`Checking forecasts for 2026-05-08...`);
  
  const forecasts = await prisma.forecast.findMany({
    where: {
      date: date,
      regionId: "western-cape"
    },
    orderBy: {
      source: "asc"
    }
  });

  console.log(`Found ${forecasts.length} forecasts:`);
  forecasts.forEach(f => {
    console.log(`- Source: ${f.source}, Slot: ${f.timeSlot}, Swell: ${f.swellHeight}m, Period: ${f.swellPeriod}s, Wind: ${f.windSpeed}kts ${f.windDirection}°`);
  });

  await prisma.$disconnect();
}

checkForecasts().catch(console.error);
