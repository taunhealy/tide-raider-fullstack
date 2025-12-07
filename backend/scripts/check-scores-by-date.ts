/**
 * Check if BeachDailyScore records exist for different dates
 * and verify they have different scores
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkScoresByDate() {
  try {
    const regionId = "western-cape";
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 2);

    const dates = [
      { date: today, label: "Today" },
      { date: tomorrow, label: "Tomorrow" },
      { date: dayAfter, label: "Day After" },
    ];

    console.log("🔍 Checking BeachDailyScore records by date...\n");
    console.log(`Region: ${regionId}\n`);

    for (const { date, label } of dates) {
      const dateStr = date.toISOString().split("T")[0];
      console.log(`📅 ${label} (${dateStr}):`);

      // Get all scores for this date
      const scores = await prisma.beachDailyScore.findMany({
        where: {
          regionId: regionId,
          date: date,
        },
        select: {
          beachId: true,
          date: true,
          source: true,
          score: true,
          beach: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          score: "desc",
        },
        take: 10, // Top 10 scores
      });

      if (scores.length === 0) {
        console.log(`   ❌ No scores found for this date\n`);
      } else {
        console.log(`   ✅ Found ${scores.length} score record(s)`);
        
        // Group by beach to show aggregated scores
        const beachScores = new Map<string, { sources: string[], total: number }>();
        
        for (const score of scores) {
          const beachName = score.beach.name;
          if (!beachScores.has(beachName)) {
            beachScores.set(beachName, { sources: [], total: 0 });
          }
          const beach = beachScores.get(beachName)!;
          beach.sources.push(score.source);
          beach.total += score.score;
        }

        console.log(`   Top beaches (aggregated across all sources):`);
        const sortedBeaches = Array.from(beachScores.entries())
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 5);

        for (const [beachName, data] of sortedBeaches) {
          console.log(`      - ${beachName}: ${data.total} points (${data.sources.join(", ")})`);
        }
        console.log("");
      }
    }

    // Check if forecasts exist for these dates
    console.log("🌤️  Checking Forecast records by date...\n");
    for (const { date, label } of dates) {
      const dateStr = date.toISOString().split("T")[0];
      const forecasts = await prisma.forecast.findMany({
        where: {
          regionId: regionId,
          date: date,
        },
        select: {
          source: true,
          date: true,
          windSpeed: true,
          swellHeight: true,
        },
      });

      if (forecasts.length === 0) {
        console.log(`   ${label} (${dateStr}): ❌ No forecasts found`);
      } else {
        console.log(`   ${label} (${dateStr}): ✅ ${forecasts.length} forecast(s) - ${forecasts.map(f => f.source).join(", ")}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("💡 Summary:");
    console.log("   - If scores exist for different dates, they should be different");
    console.log("   - If scores don't exist, forecasts need to be scraped first");
    console.log("   - Scores are calculated from forecasts");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ Error checking scores:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkScoresByDate()
  .then(() => {
    console.log("\n✨ Check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Check failed:", error);
    process.exit(1);
  });

