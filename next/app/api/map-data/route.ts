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
        country: {
          include: {
            continent: true
          }
        },
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

    const mappedBeaches = beaches.map((beach: any) => {
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
        region: beach.region.name,
        countryId: beach.countryId,
        country: beach.country.name,
        continentId: beach.country.continentId,
        continent: beach.country.continent.name,
        dailyScores: beach.beachDailyScores.reduce((acc: any, s: any) => {
        const dateStr = s.date instanceof Date 
          ? s.date.toISOString().split('T')[0] 
          : new Date(s.date).toISOString().split('T')[0];
        acc[dateStr] = {
          date: dateStr,
          rating: s.starRating
        };
        return acc;
      }, {}),
        rating: beach.beachDailyScores[0]?.starRating || 3 // Fallback for today
      };
    });

    return NextResponse.json({ beaches: mappedBeaches });
  } catch (error) {
    console.error("[api/map-data] Error:", error);
    return NextResponse.json({ error: "Failed to fetch map data" }, { status: 500 });
  }
}
