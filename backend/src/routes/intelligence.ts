import { Router } from "express";
import { IntelligenceService } from "../services/intelligenceService";

const router = Router();

router.get("/report", async (req, res) => {
  const { beach, windSpeed, windDir, swellHeight, swellPeriod, swellDir, score, persona, date, trend } = req.query;

  if (!beach || !persona || !date) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const report = await IntelligenceService.getReport(
        beach as string,
        parseFloat(windSpeed as string || "0"),
        windDir as string || "N",
        parseFloat(swellHeight as string || "0"),
        parseFloat(swellPeriod as string || "0"),
        swellDir as string || "W",
        parseFloat(score as string || "0"),
        (persona as string).toUpperCase(),
        date as string,
        trend as string
    );

    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate AI intelligence" });
  }
});

export default router;
