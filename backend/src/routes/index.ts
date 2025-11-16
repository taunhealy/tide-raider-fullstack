import { Router } from "express";
import beachesRouter from "./beaches";
import alertsRouter from "./alerts";
import logsRouter from "./logs";
import raidLogsRouter from "./raid-logs";
import cronRouter from "./cron";
import forecastRouter from "./forecast";
import filteredBeachesRouter from "./filtered-beaches";

const router = Router();

// Mount route handlers
router.use("/beaches", beachesRouter);
router.use("/alerts", alertsRouter);
router.use("/logs", logsRouter);
router.use("/raid-logs", raidLogsRouter);
router.use("/cron", cronRouter);
router.use("/forecast", forecastRouter);
router.use("/filtered-beaches", filteredBeachesRouter);

// TODO: Add more route handlers here as needed
// router.use("/user", userRouter);
// etc.

export default router;
