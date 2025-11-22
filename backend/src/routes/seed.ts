import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Track if seed is running to prevent concurrent runs
let isSeeding = false;

/**
 * POST /api/seed - Trigger database seeding
 *
 * WARNING: This endpoint should be protected in production!
 * For now, it's a simple endpoint that can be called to seed the database.
 *
 * In production, you should:
 * 1. Add authentication/authorization
 * 2. Add a secret token check
 * 3. Or remove this endpoint entirely and seed via SSH
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    // TODO: Add authentication/secret check here
    // const secret = req.headers["x-seed-secret"];
    // if (secret !== process.env.SEED_SECRET) {
    //   return res.status(401).json({ error: "Unauthorized" });
    // }

    if (isSeeding) {
      return res.status(429).json({
        error: "Seed already in progress",
        message: "Please wait for the current seed operation to complete",
      });
    }

    console.log("🌱 Seed endpoint called - starting seed process...");

    // Return immediately and run seed in background
    res.json({
      success: true,
      message: "Seed started in background",
      note: "Check logs for progress. This may take several minutes.",
    });

    // Run seed asynchronously (don't await)
    (async () => {
      isSeeding = true;
      try {
        const { exec } = require("child_process");
        const { promisify } = require("util");
        const execAsync = promisify(exec);

        console.log("Starting seed execution...");
        const { stdout, stderr } = await execAsync(
          "npx tsx prisma/seed-with-beaches.ts",
          {
            cwd: process.cwd(),
            env: { ...process.env },
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large output
          }
        );

        console.log("✅ Seed completed successfully!");
        console.log("Seed output:", stdout);
        if (stderr) console.error("Seed warnings:", stderr);
      } catch (execError: any) {
        console.error("❌ Seed execution error:", execError);
        console.error("Error details:", execError.message);
        if (execError.stderr) console.error("Stderr:", execError.stderr);
        if (execError.stdout) console.error("Stdout:", execError.stdout);
      } finally {
        isSeeding = false;
      }
    })();
  } catch (error) {
    console.error("Error in seed endpoint:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Failed to trigger seed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
});

export default router;
