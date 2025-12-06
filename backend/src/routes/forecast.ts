import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth } from "../middleware/auth";
import { dataRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// GET /api/forecast?regionId=xxx&forceRefresh=true
// Use dataRateLimiter for this frequently called endpoint
router.get(
  "/",
  dataRateLimiter,
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const regionId = req.query.regionId as string;
      const forceRefresh = req.query.forceRefresh === "true";
      const forecastDateParam = req.query.forecastDate as string | undefined;
      const sourceParam =
        (req.query.source as "WINDFINDER" | "WINDGURU" | "WINDY") ||
        "WINDFINDER";

      if (!regionId) {
        return res.status(400).json({ error: "Region ID is required" });
      }

      // Resolve regionId to actual database region ID (optimized: single query)
      const regionIdParam = regionId.toLowerCase();
      const nameFromSlug = regionIdParam
        .split("-")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");

      // Single query to find region by ID or name (more efficient than multiple queries)
      const region = await prisma.region.findFirst({
        where: {
          OR: [
            { id: regionIdParam },
            { name: { equals: nameFromSlug, mode: "insensitive" } },
            { name: { equals: regionIdParam, mode: "insensitive" } },
            { name: { contains: regionIdParam, mode: "insensitive" } },
            { name: { contains: nameFromSlug, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true }, // Only select what we need
      });

      if (!region) {
        return res.status(404).json({ error: `Region not found: ${regionId}` });
      }

      const resolvedRegionId = region.id;

      // Log region resolution for debugging
      if (regionIdParam !== resolvedRegionId) {
        console.log(
          `[forecast] Region ID resolved: "${regionIdParam}" -> "${resolvedRegionId}" (name: ${region.name})`
        );
      }

      // Parse target date - default to today if not provided
      const targetDate = forecastDateParam
        ? (() => {
            const [year, month, day] = forecastDateParam.split("-").map(Number);
            const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            return date;
          })()
        : (() => {
            const date = new Date();
            date.setUTCHours(0, 0, 0, 0);
            return date;
          })();

      // Try exact match only - no fallback to prevent returning wrong date data
      const forecast = await prisma.forecast.findUnique({
        where: {
          date_regionId_source: {
            date: targetDate,
            regionId: resolvedRegionId,
            source: sourceParam,
          },
        },
      });

      if (!forecast) {
        const dateStr = targetDate.toISOString().split("T")[0];
        console.log(
          `[forecast] No forecast found for regionId: ${resolvedRegionId} (original: ${regionId}), date: ${dateStr}, source: ${sourceParam}`
        );

        return res.status(404).json({
          error: `No forecast data found`,
          message: `No forecast data available for ${sourceParam} on ${dateStr} in region ${region.name || resolvedRegionId}`,
          regionId: resolvedRegionId,
          date: dateStr,
          source: sourceParam,
        });
      }

      return res.json(forecast);
    } catch (error) {
      console.error("Error fetching forecast data:", error);
      return res.status(500).json({ error: "Failed to fetch forecast data" });
    }
  }
);

export default router;
