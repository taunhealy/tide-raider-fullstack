import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

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

    console.log("🌱 Seed endpoint called - starting seed process...");

    // Import and run the seed script
    // Note: This requires the seed script to be available in the container
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);

    try {
      // Run the seed script
      const { stdout, stderr } = await execAsync("npx tsx prisma/seed-minimal.ts", {
        cwd: "/app",
        env: { ...process.env },
      });

      console.log("Seed output:", stdout);
      if (stderr) console.error("Seed errors:", stderr);

      return res.json({
        success: true,
        message: "Seed completed",
        output: stdout,
      });
    } catch (execError: any) {
      console.error("Seed execution error:", execError);
      return res.status(500).json({
        error: "Seed execution failed",
        message: execError.message,
        stderr: execError.stderr,
      });
    }
  } catch (error) {
    console.error("Error in seed endpoint:", error);
    return res.status(500).json({
      error: "Failed to trigger seed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

