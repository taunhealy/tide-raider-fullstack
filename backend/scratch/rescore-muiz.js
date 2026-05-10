const { prisma } = require('../src/lib/prisma');
const { ScoreService } = require('../src/services/scoreService');

async function rescoreMuizenberg() {
  try {
    const regionId = 'western-cape';
    
    // Fetch all forecasts for the next 7 days
    const forecasts = await prisma.forecast.findMany({
      where: {
        regionId,
        date: { gte: new Date() }
      }
    });

    console.log(`Found ${forecasts.length} forecasts to rescore.`);

    for (const f of forecasts) {
       await ScoreService.calculateAndStoreScores(regionId, f);
    }

    console.log("✅ Rescoring complete for Muizenberg (Western Cape).");
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

rescoreMuizenberg();
