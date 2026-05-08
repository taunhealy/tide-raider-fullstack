const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkData() {
  const dates = ["2026-04-19", "2026-04-20", "2026-04-21"];
  
  for (const dateStr of dates) {
    const date = new Date(dateStr + "T00:00:00Z");
    
    console.log(`\n--- Checking ALL slots for ${dateStr} ---`);
    const forecasts = await prisma.forecast.findMany({
      where: {
        date: date,
        regionId: "western-cape",
        source: "WINDFINDER"
      },
      orderBy: { timeSlot: 'asc' }
    });
  
    forecasts.forEach(f => {
      console.log(`[${f.timeSlot}] Swell: ${f.swellHeight}m @ ${f.swellPeriod}s, Wind: ${f.windSpeed}kts`);
    });
  }

  await prisma.$disconnect();
}

checkData();
