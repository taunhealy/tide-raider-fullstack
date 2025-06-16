import { prisma } from "@/app/lib/prisma";
import { calculateBeachScore } from "@/app/lib/scoreUtils";

export async function storeBeachDailyScores(
  forecast: any,
  region: string,
  date: Date
) {
  const regionBeaches = await prisma.beach.findMany({
    where: { region: { name: region } },
    include: { region: true },
  });

  const scoresData = regionBeaches.map((beach) => {
    const { score } = calculateBeachScore(beach, forecast);
    return {
      beachId: beach.id,
      region: beach.region.name,
      score: Math.round(score),
      conditions: forecast,
      date: date,
    };
  });

  await prisma.beachDailyScore.createMany({
    data: scoresData,
    skipDuplicates: true,
  });
}
