import { Router, Request, Response } from "express";
import { ScoreService } from "../services/scoreService";
import { getLatestConditions } from "../services/surfConditionsService";
import { prisma } from "../lib/prisma";
import {
  optionalAuth,
  authenticateToken,
  AuthRequest,
} from "../middleware/auth";
import { dataRateLimiter } from "../middleware/rateLimiter";

const router = Router();

/**
 * GET /api/beach-ratings/region-counts?date=2025-11-16
 * Get count of beaches with score >= 8 (4+ stars) per region for a given date
 */
router.get(
  "/region-counts",
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();

      const counts = await ScoreService.getRegionCounts(date);

      return res.json({ counts });
    } catch (error) {
      console.error("[beach-ratings] Error fetching region counts:", error);
      return res.status(500).json({
        error: "Failed to fetch region counts",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/beach-ratings/historical?regionId=bali&period=today
 * Get historical beach scores for a region over a time period
 * Use dataRateLimiter for this frequently called endpoint
 */
router.get(
  "/historical",
  dataRateLimiter,
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      console.log(`[beach-ratings/historical] 📥 FULL QUERY:`, req.query);
      const { regionId, period } = req.query;

      if (!regionId) {
        return res.status(400).json({ error: "regionId is required" });
      }

      // Calculate date range based on period
      // Calculate date range based on period or specific date
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      const dateParam = req.query.date as string;

      if (dateParam) {
        // Specific date requested - use exact date match (same day, no range)
        const [year, month, day] = dateParam.split("-").map(Number);
        startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        console.log(
          `[beach-ratings/historical] Specific date requested: ${dateParam}, range: ${startDate.toISOString()} to ${endDate.toISOString()}`
        );
        console.log(
          `[beach-ratings/historical] Date objects: startDate=${startDate.getTime()}, endDate=${endDate.getTime()}`
        );
      } else {
        // Period-based range (defaulting to today)
        endDate = new Date(now);
        endDate.setUTCHours(23, 59, 59, 999);

        switch (period) {
          case "week":
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            startDate.setUTCHours(0, 0, 0, 0);
            break;
          case "month":
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setUTCHours(0, 0, 0, 0);
            break;
          case "year":
            startDate = new Date(now);
            startDate.setFullYear(startDate.getFullYear() - 1);
            startDate.setUTCHours(0, 0, 0, 0);
            break;
          case "3years":
            startDate = new Date(now);
            startDate.setFullYear(startDate.getFullYear() - 3);
            startDate.setUTCHours(0, 0, 0, 0);
            break;
          case "today":
          default:
            startDate = new Date(now);
            startDate.setUTCHours(0, 0, 0, 0);
            break;
        }
      }

      // Resolve regionId (could be slug or UUID)
      let resolvedRegionId = regionId as string;
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          resolvedRegionId
        );

      if (!isUUID) {
        const region = await prisma.region.findFirst({
          where: {
            OR: [
              { id: resolvedRegionId },
              { name: { contains: resolvedRegionId, mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });

        if (!region) {
          return res.json({
            beaches: [],
            period: period || "today",
            dateRange: { start: startDate, end: endDate },
          });
        }

        resolvedRegionId = region.id;
      }

      // Get beaches for the region with scores from ALL sources
      // For specific date requests, use a tight date range (same day only) to avoid including other days
      // Note: regionId is already filtered at the beach level, so we don't need it in scoreWhereClause
      const scoreWhereClause: any = dateParam
        ? {
            // Tight date range for specific date requests (same day only)
            date: {
              gte: startDate, // 00:00:00 UTC of the requested date
              lte: endDate, // 23:59:59 UTC of the requested date
            },
          }
        : {
            // Date range for period-based requests
            date: {
              gte: startDate,
              lte: endDate,
            },
          };

      if (dateParam) {
        console.log(
          `[beach-ratings/historical] 🔍 Prisma where clause for scores (date=${dateParam}):`,
          JSON.stringify(
            {
              date: {
                gte: startDate.toISOString(),
                lte: endDate.toISOString(),
              },
            },
            null,
            2
          )
        );
      }

      const beaches = await prisma.beach.findMany({
        where: { regionId: resolvedRegionId },
        include: {
          region: true,
          beachDailyScores: {
            where: {
              ...scoreWhereClause,
              // Remove source filter to get scores from all sources
            },
            orderBy: {
              date: "desc",
            },
          },
        },
      });

      // Debug: Log the date filter being used and what we got back
      if (dateParam) {
        console.log(
          `[beach-ratings/historical] 📅 Filtering scores for date: ${dateParam} (range: ${startDate.toISOString()} to ${endDate.toISOString()})`
        );

        // Log detailed info about what scores were returned
        const beachesWithScoresCount = beaches.filter(
          (b) => b.beachDailyScores.length > 0
        ).length;
        console.log(
          `[beach-ratings/historical] 📊 Found ${beaches.length} beaches, ${beachesWithScoresCount} have scores for this date`
        );

        if (beaches.length > 0) {
          // Check first few beaches to see what dates their scores are for
          const sampleBeaches = beaches.slice(0, 3);
          sampleBeaches.forEach((beach, idx) => {
            if (beach.beachDailyScores.length > 0) {
              const scoreDates = beach.beachDailyScores.map(
                (s) => s.date.toISOString().split("T")[0]
              );
              const uniqueDates = [...new Set(scoreDates)];
              console.log(
                `[beach-ratings/historical] 🏖️  Beach "${beach.name}": ${beach.beachDailyScores.length} score(s) for date(s): ${uniqueDates.join(", ")}`
              );
            }
          });
        }
      }

      // Calculate total scores for the period, aggregating across all sources
      const beachesWithScores = beaches.map((beach) => {
        const scores = beach.beachDailyScores;

        // Average scores across sources for each unique date, then sum those averages
        const scoresByDate: Record<string, number[]> = {};
        scores.forEach(score => {
          const d = score.date.toISOString().split('T')[0];
          if (!scoresByDate[d]) scoresByDate[d] = [];
          scoresByDate[d].push(score.score || 0);
        });

        // Sum of daily averages
        const dayCount = Object.keys(scoresByDate).length;
        if (beach.name.includes("Muizenberg")) {
          console.log(`[beach-ratings/historical] 🔍 DEBUG Muizenberg:`, {
            dateCount: dayCount,
            dates: Object.keys(scoresByDate),
            scoresPerDay: Object.fromEntries(Object.entries(scoresByDate).map(([k, v]) => [k, v.length]))
          });
        }
        const totalScore = dayCount > 0 
          ? Object.values(scoresByDate).reduce(
              (sum, dayScores) => sum + (dayScores.reduce((a, b) => a + b, 0) / dayScores.length),
              0
            ) / dayCount
          : 0;

        const appearances = Object.keys(scoresByDate).length;

        // For latest score, average all sources for the most recent date
        const latestDate = scores.length > 0 ? scores[0].date : null;
        const latestScores = latestDate
          ? scores.filter((s) => s.date.getTime() === latestDate.getTime())
          : [];
        
        const latestScore = latestScores.length > 0
          ? latestScores.reduce((sum, score) => sum + (score.score || 0), 0) / latestScores.length
          : 0;

        return {
          id: beach.id,
          name: beach.name,
          region: beach.region,
          totalScore: totalScore,
          appearances,
          latestScore: latestScore,
          sourceCount: scores.length
        };
      });

      // Filter out beaches with no scores (totalScore = 0)
      const beachesWithValidScores = beachesWithScores.filter(
        (beach) => beach.totalScore > 0
      );

      // If no scores exist for the requested date, check if forecasts exist and trigger score calculation
      if (beachesWithValidScores.length === 0 && dateParam) {
        // Check if forecasts exist for this date (any source)
        const forecastsForDate = await prisma.forecast.findMany({
          where: {
            regionId: resolvedRegionId,
            date: startDate, // startDate is the requested date when dateParam is provided
          },
          select: {
            source: true,
            date: true,
          },
        });

        if (forecastsForDate.length > 0) {
          console.log(
            `[beach-ratings/historical] Found ${forecastsForDate.length} forecast(s) but no scores. Calculating scores...`
          );

          // Calculate scores for all sources that have forecasts
          const sourcesToCalculate = [
            ...new Set(forecastsForDate.map((f) => f.source)),
          ];

          for (const source of sourcesToCalculate) {
            const forecast = await prisma.forecast.findFirst({
              where: {
                regionId: resolvedRegionId,
                date: startDate,
                source: source,
              },
            });

            if (forecast) {
              try {
                // Check if scores already exist for this source
                const existingScores = await prisma.beachDailyScore.findFirst({
                  where: {
                    regionId: resolvedRegionId,
                    date: startDate,
                    source: source,
                  },
                });

                if (!existingScores) {
                  console.log(
                    `[beach-ratings/historical] Calculating scores for ${resolvedRegionId} (${source}) on ${dateParam}`
                  );
                  await ScoreService.calculateAndStoreScores(resolvedRegionId, {
                    windSpeed: forecast.windSpeed,
                    windDirection: forecast.windDirection,
                    swellHeight: forecast.swellHeight,
                    swellPeriod: forecast.swellPeriod,
                    swellDirection: forecast.swellDirection,
                    date: forecast.date,
                    source: forecast.source,
                    timeSlot: forecast.timeSlot,
                  });
                }
              } catch (scoreError: any) {
                console.error(
                  `[beach-ratings/historical] Failed to calculate scores for ${source}:`,
                  scoreError?.message
                );
              }
            }
          }

          // Re-query beaches with scores after calculation
          // Use the same date filter as the original query
          const beachesAfterCalc = await prisma.beach.findMany({
            where: { regionId: resolvedRegionId },
            include: {
              region: true,
              beachDailyScores: {
                where: scoreWhereClause, // Use the same date filter
                orderBy: {
                  date: "desc",
                },
              },
            },
          });

          // Recalculate scores
          const beachesWithScoresAfterCalc = beachesAfterCalc.map((beach) => {
            const scores = beach.beachDailyScores;
            const totalScore = scores.reduce(
              (sum, score) => sum + (score.score || 0),
              0
            );
            const uniqueDates = new Set(
              scores.map((score) => score.date.toISOString().split("T")[0])
            );
            const appearances = uniqueDates.size;
            const latestDate = scores.length > 0 ? scores[0].date : null;
            const latestScores = latestDate
              ? scores.filter((s) => s.date.getTime() === latestDate.getTime())
              : [];
            const latestScore = latestScores.reduce(
              (sum, score) => sum + (score.score || 0),
              0
            );

            return {
              id: beach.id,
              name: beach.name,
              region: beach.region,
              totalScore: totalScore,
              appearances,
              latestScore: latestScore,
            };
          });

          const beachesWithValidScoresAfterCalc =
            beachesWithScoresAfterCalc.filter((beach) => beach.totalScore > 0);

          // Use the recalculated scores
          beachesWithValidScores.push(...beachesWithValidScoresAfterCalc);
        }
      }

      // Debug logging
      console.log(
        `[beach-ratings/historical] Region: ${resolvedRegionId}, Period: ${period}`
      );
      console.log(
        `[beach-ratings/historical] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
      );
      console.log(
        `[beach-ratings/historical] Total beaches in region: ${beaches.length}`
      );

      if (beaches.length > 0) {
        const firstBeach = beaches[0];
        console.log(
          `[beach-ratings/historical] First beach (${firstBeach.name}) scores count: ${firstBeach.beachDailyScores.length}`
        );
        if (firstBeach.beachDailyScores.length > 0) {
          console.log(
            `[beach-ratings/historical] First beach first score:`,
            firstBeach.beachDailyScores[0]
          );
        }
      }

      console.log(
        `[beach-ratings/historical] Beaches with scores > 0: ${beachesWithValidScores.length}`
      );

      // Sort by total score for all periods, or latest score for today
      // If specific date is requested, sort by total score for that date (which is effectively latestScore logic since range is 1 day)
      const sortedBeaches = beachesWithValidScores.sort((a, b) =>
        period === "today" || dateParam
          ? b.latestScore - a.latestScore
          : b.totalScore - a.totalScore
      );

      // Debug: Log top 3 beaches for this date with detailed score breakdown
      if (dateParam && sortedBeaches.length > 0) {
        console.log(
          `[beach-ratings/historical] 🏆 Top 3 beaches for ${dateParam}:`,
          sortedBeaches.slice(0, 3).map((b, idx) => ({
            rank: idx + 1,
            name: b.name,
            totalScore: b.totalScore,
            latestScore: b.latestScore,
            appearances: b.appearances,
          }))
        );

        // Also log the actual score records for the top beach to verify date filtering
        if (sortedBeaches.length > 0) {
          const topBeach = beaches.find((b) => b.id === sortedBeaches[0].id);
          if (topBeach && topBeach.beachDailyScores.length > 0) {
            console.log(
              `[beach-ratings/historical] 🔍 Top beach "${topBeach.name}" score details:`,
              topBeach.beachDailyScores.map((s) => ({
                date: s.date.toISOString().split("T")[0],
                source: s.source,
                score: s.score,
              }))
            );
          }
        }
      }

      return res.json({
        beaches: sortedBeaches,
        period: period || "today",
        dateRange: {
          start: startDate,
          end: endDate,
        },
      });
    } catch (error) {
      console.error("[beach-ratings] Error fetching historical scores:", error);
      return res.status(500).json({
        error: "Failed to fetch historical beach ratings",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * POST /api/beach-ratings/calculate
 * Calculate and store scores for a region and date
 * Body: { regionId: string, date?: string, forecast?: {...} }
 */
router.post(
  "/calculate",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { regionId, date, forecast } = req.body;

      if (!regionId) {
        return res.status(400).json({ error: "regionId is required" });
      }

      const targetDate = date ? new Date(date) : new Date();
      targetDate.setUTCHours(0, 0, 0, 0);

      if (!forecast) {
        return res.status(400).json({ error: "forecast data is required" });
      }

      const scores = await ScoreService.calculateAndStoreScores(regionId, {
        ...forecast,
        date: targetDate,
      });

      return res.json({
        success: true,
        regionId,
        date: targetDate,
        scoresCalculated: scores.length,
      });
    } catch (error) {
      console.error("[beach-ratings] Error calculating scores:", error);
      return res.status(500).json({
        error: "Failed to calculate scores",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/beach-scores?beachId=xxx&date=2025-12-07
 * Get beach scores for all sources for a specific beach and date
 */
router.get(
  "/beach-scores",
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const { beachId, date } = req.query;

      if (!beachId || !date) {
        return res.status(400).json({
          error: "beachId and date are required",
        });
      }

      const [year, month, day] = (date as string).split("-").map(Number);
      const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

      const getScores = async () => {
        return prisma.beachDailyScore.findMany({
          where: {
            beachId: beachId as string,
            date: {
              gte: targetDate,
              lte: endDate,
            },
          },
          select: {
            source: true,
            score: true,
            starRating: true,
            conditions: true,
          },
          orderBy: {
            source: "asc",
          },
        });
      };

      let scores = await getScores();

      // Fallback: If no scores exist but forecasts DO exist, calculate them on the fly
      if (scores.length === 0) {
        const beach = await prisma.beach.findUnique({
          where: { id: beachId as string },
          select: { regionId: true }
        });

        if (beach) {
          let forecasts = await prisma.forecast.findMany({
            where: {
              regionId: beach.regionId,
              date: targetDate
            }
          });

          // If no forecasts exist, try to fetch them (this triggers archive if date is in the past)
          if (forecasts.length === 0) {
            console.log(`[beach-ratings/beach-scores] No forecasts found for ${beachId} on ${date}. Triggering fetch/archive...`);
            try {
              await getLatestConditions(beach.regionId, false, "WINDFINDER", 1, targetDate);
              // Re-fetch forecasts to see if we got something
              forecasts = await prisma.forecast.findMany({
                where: {
                  regionId: beach.regionId,
                  date: targetDate
                }
              });
            } catch (fetchErr) {
              console.error(`[beach-ratings/beach-scores] Failed to fetch conditions:`, fetchErr);
            }
          }

          if (forecasts.length > 0) {
            console.log(`[beach-ratings/beach-scores] Ensuring scores exist for ${beachId} on ${date}`);
            for (const forecast of forecasts) {
              try {
                // This will skip if scores already exist
                await ScoreService.calculateAndStoreScores(beach.regionId, forecast);
              } catch (calcErr) {
                console.error(`[beach-ratings/beach-scores] Failed calc for ${forecast.source}:`, calcErr);
              }
            }
            // Re-fetch scores
            scores = await getScores();
          }
        }
      }

      // Map source names to display names
      const sourceMap: Record<string, string> = {
        WINDFINDER: "Source A",
        WINDGURU: "Source B",
        WINDY: "Source C",
        OPENMETEO_ARCHIVE: "Archive Data"
      };

      const formattedScores = scores.map((score) => ({
        source: score.source,
        sourceName: sourceMap[score.source] || score.source,
        score: score.score,
        starRating: score.starRating || Math.max(1, Math.min(5, Math.floor(score.score / 2))),
        conditions: score.conditions,
      }));

      return res.json({ scores: formattedScores });
    } catch (error) {
      console.error("[beach-ratings] Error fetching beach scores:", error);
      return res.status(500).json({
        error: "Failed to fetch beach scores",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
