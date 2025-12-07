/**
 * Test if the date filter is working correctly for beach-ratings endpoint
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testDateFilter() {
  try {
    const regionId = "western-cape";
    const dates = [
      { date: "2025-12-07", label: "Today" },
      { date: "2025-12-08", label: "Tomorrow" },
      { date: "2025-12-09", label: "Day After" },
    ];

    console.log("🔍 Testing date filter for beach-ratings query...\n");
    console.log(`Region: ${regionId}\n`);

    for (const { date, label } of dates) {
      const [year, month, day] = date.split("-").map(Number);
      const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

      console.log(`📅 ${label} (${date}):`);
      console.log(
        `   Filter: ${startDate.toISOString()} to ${endDate.toISOString()}`
      );

      // Simulate the exact query from beach-ratings.ts
      const beaches = await prisma.beach.findMany({
        where: { regionId: regionId },
        include: {
          region: true,
          beachDailyScores: {
            where: {
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            orderBy: {
              date: "desc",
            },
          },
        },
      });

      // Check what dates are actually in the results
      const beachesWithScores = beaches.filter(
        (b) => b.beachDailyScores.length > 0
      );
      console.log(
        `   Found ${beaches.length} beaches, ${beachesWithScores.length} have scores`
      );

      if (beachesWithScores.length > 0) {
        // Check first beach to see what dates its scores are for
        const firstBeach = beachesWithScores[0];
        const scoreDates = firstBeach.beachDailyScores.map(
          (s) => s.date.toISOString().split("T")[0]
        );
        const uniqueDates = [...new Set(scoreDates)];
        console.log(
          `   First beach "${firstBeach.name}": ${firstBeach.beachDailyScores.length} score(s) for date(s): ${uniqueDates.join(", ")}`
        );

        // Calculate aggregated score
        const totalScore = firstBeach.beachDailyScores.reduce(
          (sum, score) => sum + (score.score || 0),
          0
        );
        console.log(`   Total score: ${totalScore}`);

        // Check if any scores are from wrong dates
        const wrongDates = uniqueDates.filter((d) => d !== date);
        if (wrongDates.length > 0) {
          console.log(
            `   ⚠️  WARNING: Scores found for wrong dates: ${wrongDates.join(", ")}`
          );
        } else {
          console.log(`   ✅ All scores are for the correct date`);
        }
      }
      console.log("");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDateFilter();
