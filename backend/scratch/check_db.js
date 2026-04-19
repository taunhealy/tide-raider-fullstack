const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkData() {
  const dates = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setUTCHours(0,0,0,0);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(d);
  }
  
  for (const date of dates) {
    console.log(`\n--- Checking Forecast data for ${date.toISOString().split('T')[0]} ---`);
    const forecasts = await prisma.forecast.findMany({
      where: {
        date: date,
        regionId: "western-cape",
        source: "WINDFINDER"
      },
      orderBy: { timeSlot: 'asc' }
    });
    console.log(`Forecasts found (${forecasts.length}):`, JSON.stringify(forecasts.map(f => f.timeSlot), null, 2));
  }

  await prisma.$disconnect();
}

checkData();
