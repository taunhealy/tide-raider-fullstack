import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testMapping() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  const sources = ["WINDGURU", "WINDY"];
  const regionId = "western-cape";
  const targetDateStr = today.toISOString().split("T")[0];

  for (const source of sources) {
    console.log(`\n=== Testing mapping for ${source} ===`);
    const beaches = await prisma.beach.findMany({
      where: { regionId },
      select: {
        id: true,
        name: true,
        coordinates: true,
        difficulty: true,
        waveType: true,
        regionId: true,
        beachDailyScores: {
          where: {
            date: { gte: today, lt: sevenDaysLater },
            source: source as any,
            category: "GENERAL"
          },
          select: {
            date: true,
            starRating: true,
            source: true,
            conditions: true
          }
        }
      },
      take: 2
    });

    const mapped = beaches.map((beach: any, index: number) => {
      try {
        const coords = typeof beach.coordinates === 'string' 
          ? JSON.parse(beach.coordinates) 
          : beach.coordinates;

        // Group scores by date
        const scoresByDate: Record<string, any[]> = {};
        if (beach.beachDailyScores) {
          (beach.beachDailyScores || []).forEach((score: any) => {
            const d = score.date.toISOString().split('T')[0];
            if (!scoresByDate[d]) scoresByDate[d] = [];
            scoresByDate[d].push(score);
          });
        }

        const dailyScores = Object.entries(scoresByDate).reduce((acc: any, [dateStr, scores]) => {
          let selectedScores = scores;
          if (scores.length > 1) {
            const superScores = scores.filter(s => s.source === "WINDFINDER_SUPER");
            if (superScores.length > 0) {
              selectedScores = superScores;
            } else {
              const firstSource = scores[0].source;
              selectedScores = scores.filter(s => s.source === firstSource);
            }
          }

          const avgRating = selectedScores.reduce((sum, s) => sum + s.starRating, 0) / selectedScores.length;
          
          acc[dateStr] = {
            date: dateStr,
            rating: avgRating,
            conditions: selectedScores[0]?.conditions || null
          };
          return acc;
        }, {});

        return {
          id: beach.id,
          name: beach.name,
          dailyScores: dailyScores,
          rating: dailyScores[targetDateStr]?.rating ?? (Object.values(dailyScores) as any[])[0]?.rating ?? 3
        };
      } catch (e) {
        console.error("Mapping error:", e);
        return null;
      }
    });

    console.log("Mapped results:", JSON.stringify(mapped, null, 2));
  }
}

testMapping()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
