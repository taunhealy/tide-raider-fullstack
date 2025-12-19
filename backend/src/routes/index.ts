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
import userSearchesRouter from "./user-searches";
import subscriptionsRouter from "./subscriptions";
import usersRouter from "./users";
import commentsRouter from "./comments";
import campingRouter from "./camping";
import testEmailRouter from "./test-email";
import hiddenGemsRouter from "./hidden-gems";
import squadsRouter from "./squads";
import promoCodesRouter from "./promo-codes";
import paypalRouter from "./paypal";
import uploadRouter from "./upload";

const router = Router();

router.use("/upload", uploadRouter);
router.use("/camping", campingRouter);

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
router.use("/user-searches", userSearchesRouter);

router.use("/users", usersRouter);
router.use("/comments", commentsRouter);
router.use("/subscriptions", subscriptionsRouter);
router.use("/test-email", testEmailRouter);
router.use("/hidden-gems", hiddenGemsRouter);
router.use("/squads", squadsRouter);
import partnersRouter from "./partners";

router.use("/promo-codes", promoCodesRouter);
router.use("/paypal", paypalRouter);
router.use("/partners", partnersRouter);

export default router;
