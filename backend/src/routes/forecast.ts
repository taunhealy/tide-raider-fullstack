import { Router, Request, Response } from "express";
import { getLatestConditions } from "../services/surfConditionsService";
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

      if (!regionId) {
        return res.status(400).json({ error: "Region ID is required" });
      }

      // Use the existing getLatestConditions function that handles scraping and caching
      const forecast = await getLatestConditions(regionId, forceRefresh);

      if (!forecast) {
        return res.status(404).json({ error: "No forecast data found" });
      }

      return res.json(forecast);
    } catch (error) {
      console.error("Error fetching forecast data:", error);
      return res.status(500).json({ error: "Failed to fetch forecast data" });
    }
  }
);

export default router;
