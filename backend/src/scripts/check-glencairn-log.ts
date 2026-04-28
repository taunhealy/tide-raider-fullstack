import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: [] });

async function main() {
  // Find the Glencairn log for Apr 24
  const entry = await prisma.logEntry.findFirst({
    where: {
      beachName: { contains: 'Glencairn', mode: 'insensitive' },
      date: new Date('2026-04-24T00:00:00Z')
    },
    include: { forecast: true }
  });

  if (!entry) { console.log("Entry not found"); return; }
  
  console.log("Log entry:", {
    id: entry.id,
    beachName: entry.beachName,
    date: entry.date,
    forecastId: entry.forecastId,
    regionId: entry.regionId,
  });
  
  console.log("\nLinked forecast:", entry.forecast
    ? { id: entry.forecast.id, windSpeed: entry.forecast.windSpeed, swellHeight: entry.forecast.swellHeight, source: entry.forecast.source }
    : "NULL — no forecast linked"
  );

  // Also check if there's a real forecast for that date in the DB
  const realForecast = await prisma.forecast.findFirst({
    where: { regionId: entry.regionId || 'western-cape', date: new Date('2026-04-24T00:00:00Z') },
    select: { id: true, source: true, windSpeed: true, swellHeight: true, swellPeriod: true }
  });
  console.log("\nActual forecast in DB for WC Apr 24:", realForecast || "None found");
}

main().catch(console.error).finally(() => prisma.$disconnect());
