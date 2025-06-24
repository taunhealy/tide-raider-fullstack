import { prisma } from "@/app/lib/prisma";
import { ScoreService } from "@/app/services/scores/ScoreService";

export async function calculateDailyScores() {
  const regions = await prisma.region.findMany();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const region of regions) {
    try {
      const forecast = await prisma.forecastA.findFirst({
        where: {
          regionId: region.id,
          date: today,
        },
      });

      if (!forecast) {
        console.log(`No forecast for region ${region.id}`);
        continue;
      }

      await ScoreService.calculateAndStoreScores(region.id, forecast);
    } catch (error) {
      console.error(`Failed for region ${region.id}:`, error);
    }
  }
}
