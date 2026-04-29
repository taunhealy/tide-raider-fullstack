import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const date = new Date("2026-04-28");
  date.setUTCHours(0, 0, 0, 0);

  const logs = await prisma.logEntry.findMany({
    where: {
      beachName: "Kalk Bay Reef",
      date: {
        gte: date,
        lt: new Date("2026-04-29T00:00:00Z")
      }
    },
    include: {
      forecast: true
    }
  });

  console.log(`Found ${logs.length} logs for Kalk Bay Reef on 2026-04-28:`);
  logs.forEach(log => {
    console.log(`Log ID: ${log.id}`);
    console.log(`Date: ${log.date.toISOString()}`);
    console.log(`Forecast:`, JSON.stringify(log.forecast, null, 2));
    console.log(`-------------------`);
  });

  const forecasts = await prisma.forecast.findMany({
    where: {
      regionId: "western-cape", // Kalk Bay is in western-cape
      date: date
    }
  });
  console.log(`Found ${forecasts.length} forecasts for western-cape on 2026-04-28:`);
  forecasts.forEach(f => {
    console.log(`Source: ${f.source}, Slot: ${f.timeSlot}, SwellDir: ${f.swellDirection}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
