import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const logId = "b5438909-67bf-41cb-b231-33400c369fff";
  console.log(`🔍 Checking Raid Log: ${logId}`);

  const raidLog = await prisma.logEntry.findUnique({
    where: { id: logId },
    include: {
        beach: true
    }
  });

  if (!raidLog) {
    console.error("❌ Raid Log not found.");
    return;
  }

  console.log(`✅ Raid Log found: ${raidLog.comments || "No comments"}`);
  console.log(`📅 Date: ${raidLog.date.toISOString()}`);
  console.log(`📍 Beach: ${raidLog.beach?.name || raidLog.beachName || "Unknown"} (${raidLog.beachId})`);
  console.log(`⏰ Time Slot: ${raidLog.surfTimeSlot || "Unknown"}`);

  // Check for forecasts on this date and region
  const regionId = raidLog.regionId;
  const date = new Date(raidLog.date);
  date.setUTCHours(0, 0, 0, 0);

  console.log(`\n🔍 Checking forecasts for region: ${regionId} on date: ${date.toISOString().split('T')[0]}`);
  
  const forecasts = await prisma.forecast.findMany({
    where: {
      regionId: regionId,
      date: date
    }
  });

  console.log(`📊 Found ${forecasts.length} forecast records.`);
  forecasts.forEach(f => {
    console.log(`  - Source: ${f.source}, Slot: ${f.timeSlot}, Wind: ${f.windSpeed}kts ${f.windDirection}°, Swell: ${f.swellHeight}m ${f.swellPeriod}s ${f.swellDirection}°`);
  });

  if (forecasts.length === 0) {
      console.log("⚠️ No forecast data found for this date/region.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
