import { Router } from "express";
import beachesRouter from "./beaches";
import alertsRouter from "./alerts";
import logsRouter from "./logs";
import raidLogsRouter from "./raid-logs";
import cronRouter from "./cron";
import forecastRouter from "./forecast";
import filteredBeachesRouter from "./filtered-beaches";
import regionsRouter from "./regions";
import notificationsRouter from "./notifications";
import blogPostsRouter from "./blog-posts";
import seedRouter from "./seed";
import authRouter from "./auth";
import beachRatingsRouter from "./beach-ratings";

const router = Router();

// Mount route handlers
router.use("/auth", authRouter);
router.use("/beaches", beachesRouter);
router.use("/alerts", alertsRouter);
router.use("/logs", logsRouter);
router.use("/raid-logs", raidLogsRouter);
router.use("/cron", cronRouter);
router.use("/forecast", forecastRouter);
router.use("/filtered-beaches", filteredBeachesRouter);
router.use("/regions", regionsRouter);
router.use("/notifications", notificationsRouter);
router.use("/blog-posts", blogPostsRouter);
router.use("/seed", seedRouter);
router.use("/beach-ratings", beachRatingsRouter);

// TODO: Add more route handlers here as needed
// router.use("/user", userRouter);
// etc.

export default router;
