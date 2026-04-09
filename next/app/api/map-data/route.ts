import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

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
            date: 'asc'
          }
        }
      }
    });

    const mappedBeaches = beaches.map((beach: any, index: number) => {
      try {
        const coords = typeof beach.coordinates === 'string' 
          ? JSON.parse(beach.coordinates) 
          : beach.coordinates;
          
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
          dailyScores: (beach.beachDailyScores || []).reduce((acc: any, s: any) => {
            try {
              const dateStr = s.date instanceof Date 
                ? s.date.toISOString().split('T')[0] 
                : new Date(s.date).toISOString().split('T')[0];
              acc[dateStr] = {
                date: dateStr,
                rating: s.starRating
              };
            } catch (e) {
              console.warn(`[api/map-data] Error mapping score for beach ${beach.id}:`, e);
            }
            return acc;
          }, {}),
          rating: beach.beachDailyScores?.[0]?.starRating || beach.rating || 3 // Fallback
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
