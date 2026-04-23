import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    // Fetch all beaches and their scores for the next week
    const beaches = await prisma.beach.findMany({
      include: {
        region: true,
        country: true,
        beachDailyScores: {
          where: {
            date: {
              gte: today,
              lt: sevenDaysLater
            }
          },
          orderBy: {
            date: 'desc' // Latest entries first if there are duplicates
          }
        }
      }
    });

    const mappedBeaches = beaches.map((beach: any, index: number) => {
      try {
        const coords = typeof beach.coordinates === 'string' 
          ? JSON.parse(beach.coordinates) 
          : beach.coordinates;

        // Group scores by date to aggregate (average) across sources
        const scoresByDate: Record<string, any[]> = {};
        (beach.beachDailyScores || []).forEach((score: any) => {
          const d = score.date.toISOString().split('T')[0];
          if (!scoresByDate[d]) scoresByDate[d] = [];
          scoresByDate[d].push(score);
        });

        // Map grouped scores to average ratings and conditions
        const dailyScores = Object.entries(scoresByDate).reduce((acc: any, [dateStr, scores]) => {
          const avgRating = scores.reduce((sum, s) => sum + s.starRating, 0) / scores.length;
          
          // Use the first score with conditions as representative
          const representativeScores = scores.filter(s => s.conditions && typeof s.conditions === 'object');
          const conditions = representativeScores.length > 0 ? representativeScores[0].conditions : null;

          acc[dateStr] = {
            date: dateStr,
            rating: avgRating,
            conditions: conditions
          };
          return acc;
        }, {});
          
        return {
          id: beach.id,
          name: beach.name,
          location: beach.location,
          coordinates: {
            lat: Number(coords?.lat || 0),
            lng: Number(coords?.lng || 0)
          },
          difficulty: beach.difficulty,
          waveType: beach.waveType,
          regionId: beach.regionId,
          region: beach.region?.name || "Unknown Region",
          countryId: beach.countryId || "unknown",
          country: beach.country?.name || "Unknown Country",
          continentId: beach.country?.continentId || beach.continent?.toLowerCase() || "unknown",
          continent: beach.continent || "Unknown Continent",
          isHiddenGem: beach.isHiddenGem || false,
          isLongboarding: beach.isLongboarding || false,
          isFoiling: beach.isFoiling || false,
          optimalWindDirections: beach.optimalWindDirections || [],
          optimalSwellDirections: beach.optimalSwellDirections || { min: 0, max: 360 },
          swellSize: beach.swellSize || { min: 0, max: 10 },
          idealSwellPeriod: beach.idealSwellPeriod || { min: 0, max: 25 },
          dailyScores: dailyScores,
          rating: Object.values(dailyScores as any)[0]?.rating || beach.rating || 3
        };
      } catch (e) {
        console.error(`[api/map-data] Error mapping beach at index ${index} (${beach?.id || "unknown"}):`, e);
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({ beaches: mappedBeaches });
  } catch (error) {
    console.error("[api/map-data] Error:", error);
    return NextResponse.json({ error: "Failed to fetch map data" }, { status: 500 });
  }
}
