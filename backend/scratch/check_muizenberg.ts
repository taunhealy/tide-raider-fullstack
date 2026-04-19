import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkData() {
  const date = new Date();
  date.setUTCHours(0,0,0,0);
  const dateStr = date.toISOString().split('T')[0];

  console.log(`Checking Forecast data for ${dateStr}...`);
  const forecasts = await prisma.forecast.findMany({
    where: {
      date: date,
      regionId: "western-cape"
    }
  });
  console.log("Forecasts found:", JSON.stringify(forecasts, null, 2));

  console.log("Checking BeachDailyScore for Muizenberg...");
  const scores = await prisma.beachDailyScore.findMany({
    where: {
      beachId: "muizenberg-beach",
      date: date
    }
  });
  console.log("Scores found:", JSON.stringify(scores, null, 2));

  await prisma.$disconnect();
}

checkData().catch(console.error);
