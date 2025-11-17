import { Router, Request, Response } from "express";
import { optionalAuth } from "../middleware/auth";
import { dataRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// GET /api/blog-posts - Get blog posts (placeholder for now)
// Use dataRateLimiter for this frequently called endpoint
router.get("/", dataRateLimiter, optionalAuth, async (req: Request, res: Response) => {
  try {
    // Return empty array as placeholder
    // This can be implemented later if needed
    return res.json([]);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

export default router;
