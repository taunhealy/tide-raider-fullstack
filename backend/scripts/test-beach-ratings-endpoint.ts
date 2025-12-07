/**
 * Test the beach-ratings/historical endpoint with different dates
 * to verify it returns different scores for each date
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testEndpointLogic() {
  try {
    const regionId = "western-cape";
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const dates = [
      { date: today, label: "Today", dateStr: today.toISOString().split("T")[0] },
      { date: tomorrow, label: "Tomorrow", dateStr: tomorrow.toISOString().split("T")[0] },
    ];

    console.log("🧪 Testing beach-ratings/historical endpoint logic...\n");
    console.log(`Region: ${regionId}\n`);

    for (const { date, label, dateStr } of dates) {
      console.log(`="`.repeat(30));
      console.log(`Testing ${label} (${dateStr})`);
      console.log(`="`.repeat(30));

      // Simulate the exact query from the endpoint
      const startDate = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0, 0, 0, 0
      ));

      console.log(`Query date: ${startDate.toISOString()}`);

      // Get beaches with scores for this exact date
      const beaches = await prisma.beach.findMany({
        where: { regionId: regionId },
        include: {
          region: true,
          beachDailyScores: {
            where: {
              date: startDate, // Exact date match
            },
            orderBy: {
              date: "desc",
            },
          },
        },
      });

      console.log(`Found ${beaches.length} beaches in region`);

      // Calculate total scores (same logic as endpoint)
      const beachesWithScores = beaches.map((beach) => {
        const scores = beach.beachDailyScores;
        const totalScore = scores.reduce(
          (sum, score) => sum + (score.score || 0),
          0
        );
        const uniqueDates = new Set(
          scores.map((score) => score.date.toISOString().split("T")[0])
        );
        const appearances = uniqueDates.size;
        const latestDate = scores.length > 0 ? scores[0].date : null;
        const latestScores = latestDate
          ? scores.filter((s) => s.date.getTime() === latestDate.getTime())
          : [];
        const latestScore = latestScores.reduce(
          (sum, score) => sum + (score.score || 0),
          0
        );

        return {
          id: beach.id,
          name: beach.name,
          totalScore: totalScore,
          appearances,
          latestScore: latestScore,
          scoreCount: scores.length,
          sources: scores.map(s => s.source),
        };
      });

      const beachesWithValidScores = beachesWithScores.filter(
        (beach) => beach.totalScore > 0
      );

      // Sort by total score
      const sortedBeaches = beachesWithValidScores.sort(
        (a, b) => b.latestScore - a.latestScore
      );

      console.log(`\n✅ Beaches with scores: ${sortedBeaches.length}`);
      console.log(`Top 5 beaches for ${label}:`);
      sortedBeaches.slice(0, 5).forEach((beach, index) => {
        console.log(
          `   ${index + 1}. ${beach.name}: ${beach.totalScore} total (${beach.latestScore} latest) - Sources: ${beach.sources.join(", ")}`
        );
      });

      console.log("");
    }

    // Compare the results
    console.log("=".repeat(60));
    console.log("🔍 Comparison:");
    console.log("   If the top beaches are different, the endpoint is working correctly");
    console.log("   If they're the same, there's a filtering issue");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ Error testing endpoint:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testEndpointLogic()
  .then(() => {
    console.log("\n✨ Test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });

