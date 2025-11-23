import { prisma } from "./src/lib/prisma";
import { ScoreService } from "./src/services/scoreService";

async function calculateScoresForRegion() {
  console.log("Calculating scores for Western Cape...\n");

  try {
    // Get the most recent forecast for Western Cape
    const forecast = await prisma.forecast.findFirst({
      where: {
        regionId: "western-cape",
      },
      orderBy: {
        date: "desc",
      },
    });

    if (!forecast) {
      console.log("❌ No forecast data found for Western Cape");
      return;
    }

    console.log(`✅ Found forecast for ${forecast.date.toISOString().split("T")[0]}`);
    console.log(`   Source: ${forecast.source}`);
    console.log(`   Wind: ${forecast.windSpeed} kts from ${forecast.windDirection}°`);
    console.log(`   Swell: ${forecast.swellHeight}m @ ${forecast.swellPeriod}s from ${forecast.swellDirection}°\n`);

    // Calculate and store scores
    console.log("Calculating scores for all beaches...");
    const scores = await ScoreService.calculateAndStoreScores(
      "western-cape",
      forecast
    );

    console.log(`\n✅ Successfully calculated ${scores.length} beach scores!`);
    console.log("\nTop 5 scores:");
    scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .forEach((score, i) => {
        const beach = scores.find((s) => s.beachId === score.beachId);
        console.log(`${i + 1}. Beach ${score.beachId}: ${score.score}/10 (${score.starRating} stars)`);
      });

    console.log("\n✅ Done! Scores are now available in the RegionalHighScores widget.");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

calculateScoresForRegion();
