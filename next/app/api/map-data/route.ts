import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { redis } from "@/app/lib/redis";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const timeSlot = searchParams.get("timeSlot");

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    // Create cache key
    const cacheKey = `map-data-v2:${source || 'all'}:${timeSlot || 'all'}`;
    let cached;
    try {
      cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[api/map-data] 🚀 Serving from cache`);
        return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
      }
    } catch (redisError) {
      console.error("[api/map-data] Redis error (continuing without cache):", redisError);
    }

    // Fetch all beaches and their scores for the next week
    const beaches = await prisma.beach.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        coordinates: true,
        difficulty: true,
        waveType: true,
        regionId: true,
        countryId: true,
        continent: true,
        isHiddenGem: true,
        isLongboarding: true,
        isFoiling: true,
        region: {
          select: {
            name: true
          }
        },
        country: {
          select: {
            name: true,
            continentId: true
          }
        },
        sourceAccuracy: {
          select: {
            source: true,
            voteCount: true
          }
        },
        conditionProfiles: {
          where: { category: "GENERAL" }
        },
        beachDailyScores: {
          where: {
            date: {
              gte: today,
              lt: sevenDaysLater
            },
            ...(source ? { source } : {}),
            ...(timeSlot ? { timeSlot: timeSlot as any } : {})
          },
          select: {
            date: true,
            starRating: true,
            conditions: true
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    const mappedBeaches = beaches.map((beach: any, index: number) => {
      try {
        const coords = typeof beach.coordinates === 'string' 
          ? JSON.parse(beach.coordinates) 
          : beach.coordinates;

        // Group scores by date
        const scoresByDate: Record<string, any[]> = {};
        (beach.beachDailyScores || []).forEach((score: any) => {
          const d = score.date.toISOString().split('T')[0];
          if (!scoresByDate[d]) scoresByDate[d] = [];
          scoresByDate[d].push(score);
        });

        // Map grouped scores to average ratings
        const dailyScores = Object.entries(scoresByDate).reduce((acc: any, [dateStr, scores]) => {
          const avgRating = scores.reduce((sum, s) => sum + s.starRating, 0) / scores.length;
          
          acc[dateStr] = {
            date: dateStr,
            rating: avgRating,
            conditions: scores[0]?.conditions || null
          };
          return acc;
        }, {});
          
        const profile = beach.conditionProfiles?.[0] || {};

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
          dailyScores: dailyScores,
          optimalWindDirections: profile.optimalWindDirections || [],
          optimalSwellDirections: profile.optimalSwellDirections || { min: 0, max: 360 },
          swellSize: profile.swellSize || { min: 0, max: 10 },
          idealSwellPeriod: profile.idealSwellPeriod || { min: 0, max: 25 },
          optimalTide: profile.optimalTide || "ALL",
          mostAccurateSource: beach.sourceAccuracy?.sort((a: any, b: any) => b.voteCount - a.voteCount)[0]?.source || null,
          sourceAccuracyCount: beach.sourceAccuracy?.reduce((sum: number, s: any) => sum + s.voteCount, 0) || 0,
          rating: (Object.values(dailyScores) as any[])[0]?.rating || beach.rating || 3
        };
      } catch (e) {
        console.error(`[api/map-data] Error mapping beach at index ${index} (${beach?.id || "unknown"}):`, e);
        return null;
      }
    }).filter(Boolean);

    // Sort to prioritize South Africa (Western Cape) first
    const sortedBeaches = (mappedBeaches as any[]).sort((a: any, b: any) => {
      if (a.regionId === 'western-cape' && b.regionId !== 'western-cape') return -1;
      if (a.regionId !== 'western-cape' && b.regionId === 'western-cape') return 1;
      return 0;
    });

    const responseData = { beaches: sortedBeaches };
    
    // Cache for 1 hour (3600 seconds)
    try {
      await redis.set(cacheKey, JSON.stringify(responseData), { ex: 3600 });
    } catch (redisError) {
      console.error("[api/map-data] Redis set error:", redisError);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[api/map-data] ❌ CRITICAL ERROR:", error);
    if (error instanceof Error) {
      console.error("[api/map-data] Stack:", error.stack);
    }
    return NextResponse.json({ 
      error: "Failed to fetch map data", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
