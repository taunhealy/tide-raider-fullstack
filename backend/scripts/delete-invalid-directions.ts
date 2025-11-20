import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteInvalidDirections() {
  try {
    console.log(
      "🗑️  Deleting forecasts with invalid directions (> 360 degrees)..."
    );

    // Delete forecasts with invalid directions (> 360 degrees)
    const deletedForecasts = await prisma.forecast.deleteMany({
      where: {
        OR: [{ windDirection: { gt: 360 } }, { swellDirection: { gt: 360 } }],
      },
    });

    console.log(
      `✅ Deleted ${deletedForecasts.count} forecast(s) with invalid directions`
    );

    // Delete scores that have invalid directions in their conditions JSON
    // We need to find scores where conditions.windDirection > 360 or conditions.swellDirection > 360
    console.log("🔍 Finding scores with invalid directions in conditions...");

    // Get all scores and check their conditions
    const allScores = await prisma.beachDailyScore.findMany({
      select: {
        id: true,
        conditions: true,
      },
    });

    const invalidScoreIds: string[] = [];

    for (const score of allScores) {
      const conditions = score.conditions as any;
      if (conditions) {
        const windDir =
          typeof conditions.windDirection === "number"
            ? conditions.windDirection
            : parseFloat(conditions.windDirection) || 0;
        const swellDir =
          typeof conditions.swellDirection === "number"
            ? conditions.swellDirection
            : parseFloat(conditions.swellDirection) || 0;

        if (windDir > 360 || swellDir > 360) {
          invalidScoreIds.push(score.id);
        }
      }
    }

    if (invalidScoreIds.length > 0) {
      const deletedScores = await prisma.beachDailyScore.deleteMany({
        where: {
          id: { in: invalidScoreIds },
        },
      });
      console.log(
        `✅ Deleted ${deletedScores.count} score(s) with invalid directions in conditions`
      );
    } else {
      console.log("✅ No scores with invalid directions found");
    }

    console.log(`\n✨ Done! Invalid direction data cleaned up.`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Re-deploy the backend with the validation fixes`);
    console.log(`   2. Re-scrape affected regions to get corrected data`);
  } catch (error) {
    console.error("❌ Error deleting invalid directions:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteInvalidDirections()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
