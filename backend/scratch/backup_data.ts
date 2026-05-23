import { prisma } from "../src/lib/prisma";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting database backup process...");

  try {
    // 1. Backup all log entries
    console.log("📦 Fetching log entries...");
    const logEntries = await prisma.logEntry.findMany({
      orderBy: { date: "desc" }
    });
    const logEntriesPath = path.join(__dirname, "backup_log_entries.json");
    fs.writeFileSync(logEntriesPath, JSON.stringify(logEntries, null, 2));
    console.log(`✅ Log entries backup complete: ${logEntries.length} entries written to ${logEntriesPath}`);

    // 2. Backup last 2 months of Western Cape data
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    twoMonthsAgo.setHours(0, 0, 0, 0);
    console.log(`📅 Backing up Western Cape forecast & scoring data from ${twoMonthsAgo.toISOString()} onwards...`);

    // Fetch forecasts
    console.log("🌊 Fetching Western Cape forecasts...");
    const forecasts = await prisma.forecast.findMany({
      where: {
        regionId: "western-cape",
        date: { gte: twoMonthsAgo }
      },
      orderBy: { date: "asc" }
    });

    // Fetch scores
    console.log("⭐ Fetching Western Cape daily scores...");
    const scores = await prisma.beachDailyScore.findMany({
      where: {
        regionId: "western-cape",
        date: { gte: twoMonthsAgo }
      },
      orderBy: { date: "asc" }
    });

    const westernCapeData = {
      exportedAt: new Date().toISOString(),
      twoMonthsAgoThreshold: twoMonthsAgo.toISOString(),
      forecastsCount: forecasts.length,
      scoresCount: scores.length,
      forecasts,
      scores
    };

    const westernCapePath = path.join(__dirname, "backup_western_cape_2_months.json");
    fs.writeFileSync(westernCapePath, JSON.stringify(westernCapeData, null, 2));
    console.log(`✅ Western Cape backup complete: ${forecasts.length} forecasts and ${scores.length} daily scores written to ${westernCapePath}`);

    console.log("🎉 All backups completed successfully!");
  } catch (error) {
    console.error("❌ Error performing backup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
