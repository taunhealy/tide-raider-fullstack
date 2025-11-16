import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ScoreService } from "../services/scoreService";
import { getLatestConditions } from "../services/surfConditionsService";
import { optionalAuth } from "../middleware/auth";
import {
  Season,
  Prisma,
  OptimalTide,
  WaveType,
  CrimeLevel,
  Difficulty,
  Hazard,
} from "@prisma/client";

const router = Router();

// GET /api/filtered-beaches?regionId=xxx&searchQuery=xxx&...
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const regionId = (req.query.regionId as string)?.toLowerCase();
    const searchQuery = req.query.searchQuery as string | undefined;

    console.log(
      `[filtered-beaches] Request received for regionId: ${regionId}`
    );

    if (!regionId) {
      return res.status(400).json({ error: "regionId is required" });
    }

    // Handle array parameters properly
    const crimeLevelParam = req.query.crimeLevel as string | undefined;
    const crimeLevels = crimeLevelParam
      ? (crimeLevelParam.split(",") as CrimeLevel[])
      : undefined;

    const whereClause: Prisma.BeachWhereInput = {
      regionId,
      ...(searchQuery && {
        OR: [
          {
            name: {
              contains: searchQuery,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            location: {
              contains: searchQuery,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }),
      ...(req.query.optimalTide && {
        optimalTide: req.query.optimalTide as OptimalTide,
      }),
      ...(req.query.waveType && {
        waveType: req.query.waveType as WaveType,
      }),
      ...(crimeLevels && {
        crimeLevel: {
          in: crimeLevels,
        },
      }),
      ...(req.query.bestSeasons && {
        bestSeasons: {
          hasSome: (req.query.bestSeasons as string).split(",") as Season[],
        },
      }),
      ...(req.query.difficulty && {
        difficulty: req.query.difficulty as Difficulty,
      }),
      ...(req.query.hazards && {
        hazards: {
          hasSome: (req.query.hazards as string).split(",") as Hazard[],
        },
      }),
    };

    // Get current date at midnight UTC
    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);

    // Step 1: Get or fetch forecast data
    let forecast = await prisma.forecastA.findFirst({
      where: {
        regionId,
        date: currentDate,
      },
      select: {
        windSpeed: true,
        windDirection: true,
        swellHeight: true,
        swellPeriod: true,
        swellDirection: true,
        date: true,
      },
    });

    // If no forecast exists, try to fetch it
    if (!forecast) {
      try {
        const fetchedForecast = await getLatestConditions(regionId, false);
        if (fetchedForecast) {
          forecast = {
            windSpeed: fetchedForecast.windSpeed,
            windDirection: fetchedForecast.windDirection,
            swellHeight: fetchedForecast.swellHeight,
            swellPeriod: fetchedForecast.swellPeriod,
            swellDirection: fetchedForecast.swellDirection,
            date: currentDate,
          };
        }
      } catch (error) {
        console.error("Failed to fetch forecast:", error);
      }
    }

    // Step 2: Check if scores exist for today
    const existingScores = await prisma.beachDailyScore.count({
      where: {
        regionId,
        date: currentDate,
      },
    });

    // Also check if all existing scores are 0 (which might indicate they need recalculation)
    const existingScoresData = await prisma.beachDailyScore.findMany({
      where: {
        regionId,
        date: currentDate,
      },
      select: {
        score: true,
        beachId: true,
      },
      take: 5, // Sample first 5
    });

    const allScoresZero =
      existingScoresData.length > 0 &&
      existingScoresData.every((s) => s.score === 0);
    console.log(`Existing scores sample:`, existingScoresData);
    console.log(`All scores are zero: ${allScoresZero}`);

    // Step 3: Calculate scores if they don't exist OR if all scores are 0 (recalculate)
    if ((existingScores === 0 || allScoresZero) && forecast) {
      console.log(
        `${existingScores === 0 ? "Calculating" : "Recalculating"} scores for ${regionId} on ${currentDate.toISOString().split("T")[0]}...`
      );
      try {
        await ScoreService.calculateAndStoreScores(regionId, {
          ...forecast,
          date: currentDate,
        });
        console.log("✓ Scores calculated and stored");

        // Verify scores were created and log sample values
        const verifyScores = await prisma.beachDailyScore.findMany({
          where: {
            regionId,
            date: currentDate,
          },
          select: {
            beachId: true,
            score: true,
          },
          take: 5,
        });
        console.log(
          `✓ Verified ${verifyScores.length} scores exist for ${regionId}`
        );
        console.log(`Sample calculated scores:`, verifyScores);
      } catch (error) {
        console.error("Failed to calculate scores:", error);
      }
    } else if (existingScores === 0) {
      console.log(
        `⚠ No forecast data available for ${regionId}, cannot calculate scores`
      );
    } else {
      console.log(
        `✓ Using existing scores (${existingScores} beaches) for ${regionId}`
      );
    }

    // Step 4: Fetch beaches with their daily scores (now guaranteed to exist)
    const beaches = await prisma.beach.findMany({
      where: whereClause,
      include: {
        region: true,
        beachDailyScores: {
          where: { date: currentDate },
          select: {
            score: true,
            conditions: true,
            date: true,
          },
        },
      },
    });

    console.log(`Fetched ${beaches.length} beaches for ${regionId}`);
    console.log(
      `Beaches with scores: ${beaches.filter((b) => b.beachDailyScores.length > 0).length}`
    );

    // Transform scores into a flat dictionary, ensuring the full beach object is included.
    const scores = beaches.reduce(
      (
        acc: Record<string, { score: number; beach: (typeof beaches)[number] }>,
        beach
      ) => {
        const dailyScore =
          beach.beachDailyScores.length > 0 ? beach.beachDailyScores[0] : null;
        acc[beach.id] = {
          score: dailyScore?.score ?? 0,
          beach: {
            ...beach,
            beachDailyScores: dailyScore ? [dailyScore] : [], // Ensure beachDailyScores is an array
          },
        };
        return acc;
      },
      {}
    );

    console.log(
      `Transformed scores object has ${Object.keys(scores).length} entries`
    );
    console.log(
      `Sample scores:`,
      Object.entries(scores)
        .slice(0, 3)
        .map(([id, data]) => ({ beachId: id, score: data.score }))
    );

    // Log the response structure
    const responseData = {
      beaches: beaches.map((beach) => {
        const { beachDailyScores, ...beachData } = beach;
        return beachData;
      }),
      scores,
      forecast,
      totalCount: beaches.length,
    };

    console.log(`[filtered-beaches] Response:`, {
      beachCount: responseData.beaches.length,
      scoreCount: Object.keys(responseData.scores).length,
      hasForecast: !!responseData.forecast,
      sampleScoreKeys: Object.keys(responseData.scores).slice(0, 3),
    });

    // Return transformed data structure
    return res.json(responseData);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Failed to fetch filtered beaches" });
  }
});

export default router;
