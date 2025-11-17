import { Router, Request, Response } from "express";
import {
  authenticateToken,
  optionalAuth,
  AuthRequest,
} from "../middleware/auth";
import { AlertService, AlertType } from "../services/alertService";
import { validate } from "../middleware/validation";
import {
  createAlertSchema,
  updateAlertSchema,
  getAlertParamsSchema,
  getAlertsQuerySchema,
  notifyAlertsSchema,
  testForceAlertQuerySchema,
} from "../validators/alertValidators";
import { dataRateLimiter } from "../middleware/rateLimiter";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/alerts - Fetch alerts, regions, or dates
// Use dataRateLimiter for this frequently called endpoint
router.get(
  "/",
  dataRateLimiter,
  optionalAuth,
  validate({ query: getAlertsQuerySchema }),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { starRatings, region, logEntryId } = req.query;
      const isBetaMode = process.env.NEXT_PUBLIC_APP_MODE === "beta";

      // Return available star ratings
      if (starRatings) {
        return res.json(AlertService.getAvailableStarRatings());
      }

      const isAuthenticated = !!authReq.user?.id;

      // Case 0: If logEntryId is provided
      if (logEntryId) {
        if (!isAuthenticated && !isBetaMode) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const logEntryData = await AlertService.getLogEntryForAlert(
          logEntryId as string,
          authReq.user?.id
        );

        if (!logEntryData) {
          return res.status(404).json({ error: "Log entry not found" });
        }

        return res.json({
          forecast: logEntryData.forecast,
          region: logEntryData.region,
          date: logEntryData.date,
          ...(logEntryData.existingAlertId && {
            id: logEntryData.existingAlertId,
          }),
        });
      }

      // Case 1 & 2: Region-related queries
      if (req.query.region !== undefined && !region) {
        const regions = await AlertService.getRegionsWithForecasts();
        return res.json(regions);
      }

      if (region) {
        const dates = await AlertService.getDatesForRegion(region as string);
        return res.json(dates);
      }

      // Case 3: Fetching user's alerts - return empty array for unauthenticated users
      if (!isAuthenticated || !authReq.user?.id) {
        return res.json([]);
      }

      const alerts = await AlertService.getUserAlerts(authReq.user.id);
      return res.json(alerts);
    } catch (error) {
      console.error("Error processing request:", error);
      return res.status(500).json({ error: "Failed to process request" });
    }
  }
);

// POST /api/alerts - Create a new alert
router.post(
  "/",
  authenticateToken,
  validate({ body: createAlertSchema }),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if user is premium (has active subscription)
      const user = await prisma.user.findUnique({
        where: { id: authReq.user.id },
        select: {
          subscriptionStatus: true,
          hasActiveTrial: true,
        },
      });

      const isPremium =
        user?.subscriptionStatus === "ACTIVE" || user?.hasActiveTrial === true;

      // Check alert limit: Free users can only have 1 alert
      if (!isPremium) {
        const existingAlerts = await prisma.alert.count({
          where: {
            userId: authReq.user.id,
            active: true,
          },
        });

        if (existingAlerts >= 1) {
          return res.status(403).json({
            error: "Alert limit reached",
            message:
              "Free users can only have 1 active alert. Upgrade to premium for unlimited alerts.",
            code: "ALERT_LIMIT_REACHED",
            requiresUpgrade: true,
          });
        }
      }

      const alert = await AlertService.createAlert(authReq.user.id, req.body);
      return res.json(alert);
    } catch (error) {
      console.error("Alert creation error details:", error);
      return res.status(500).json({
        error: "Failed to create alert",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/alerts/notify - Process alerts for a user
// Requires authentication - users can only trigger alerts for themselves
router.post(
  "/notify",
  authenticateToken,
  validate({ body: notifyAlertsSchema }),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { userId } = req.body;

      // Security: Users can only trigger alerts for themselves
      if (userId !== authReq.user.id) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only trigger alerts for your own account",
        });
      }

      const { processUserAlerts } = await import("../services/alertProcessor");
      const result = await processUserAlerts(userId, new Date());

      return res.json({
        success: true,
        processed: result,
      });
    } catch (error) {
      console.error("Error processing alerts:", error);
      return res.status(500).json({
        error: "Failed to process alerts",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// GET /api/alerts/test-force?alertId=xxx - Force test an alert notification
router.get(
  "/test-force",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const alertId = req.query.alertId as string | undefined;

      // Get user's alerts
      const userAlerts = await AlertService.getUserActiveAlerts(
        authReq.user.id
      );

      if (userAlerts.length === 0) {
        return res.status(404).json({
          error: "No active alerts found. Please create an alert first.",
        });
      }

      // Find the alert to test
      const alertToTest = alertId
        ? userAlerts.find((a: any) => a.id === alertId)
        : userAlerts[0];

      if (!alertToTest) {
        return res.status(404).json({
          error: `Alert with ID ${alertId} not found`,
          availableAlerts: userAlerts.map((a: any) => ({
            id: a.id,
            name: a.name,
          })),
        });
      }

      console.log("🧪 Force testing alert:", alertToTest.id, alertToTest.name);

      // Create a mock match to force trigger the notification
      type AlertMatch = {
        alertId: string;
        alertName: string;
        region: string;
        timestamp: Date;
        matchedProperties: Array<{
          property: string;
          logValue: any;
          forecastValue: any;
          difference: number;
          withinRange: boolean;
        }>;
        matchDetails: string;
      };
      const mockMatch: AlertMatch = {
        alertId: alertToTest.id,
        alertName: alertToTest.name,
        region: alertToTest.regionId,
        timestamp: new Date(),
        matchedProperties: alertToTest.properties?.map((prop: any) => ({
          property: prop.property,
          logValue: prop.optimalValue,
          forecastValue: prop.optimalValue, // Match exactly for testing
          difference: 0,
          withinRange: true,
        })) || [
          {
            property: "swellHeight",
            logValue: 1.5,
            forecastValue: 1.5,
            difference: 0,
            withinRange: true,
          },
        ],
        matchDetails: "Test alert - conditions match (forced for testing)",
      };

      // Get beach name
      const beachName =
        (alertToTest.logEntry as any)?.beach?.name ||
        (alertToTest.logEntry as any)?.beachName ||
        "Test Beach";

      // For testing, delete any existing notifications from today so we can test again
      await AlertService.deleteTodayNotifications(alertToTest.id);

      // Send the notification
      console.log("📧 Sending test notification to:", alertToTest.contactInfo);
      const { sendAlertNotification } = await import(
        "../services/notificationService"
      );

      let success = false;
      let errorDetails: string | null = null;

      try {
        success = await sendAlertNotification(
          mockMatch,
          alertToTest as any,
          beachName
        );

        if (!success) {
          // Check if there's a recent notification record that might have error details
          const recentNotification = await prisma.alertNotification.findFirst({
            where: {
              alertId: alertToTest.id,
              createdAt: {
                gte: new Date(Date.now() - 60000), // Last minute
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          if (recentNotification && !recentNotification.success) {
            errorDetails = recentNotification.details || "Unknown error";
          } else {
            errorDetails =
              "Email sending returned false - check RESEND_API_KEY and logs";
          }
        }
      } catch (error) {
        console.error("❌ Error in sendAlertNotification:", error);
        errorDetails = error instanceof Error ? error.message : "Unknown error";
      }

      if (success) {
        return res.json({
          success: true,
          message: "Test alert notification sent successfully!",
          alert: {
            id: alertToTest.id,
            name: alertToTest.name,
            notificationMethod: alertToTest.notificationMethod,
            contactInfo: alertToTest.contactInfo,
            beachName: beachName,
          },
          note: `Check ${alertToTest.contactInfo} for the test email`,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Failed to send notification",
          error:
            errorDetails ||
            "Email sending failed - check RESEND_API_KEY configuration",
          alert: {
            id: alertToTest.id,
            name: alertToTest.name,
            notificationMethod: alertToTest.notificationMethod,
            contactInfo: alertToTest.contactInfo,
          },
          troubleshooting: {
            checkApiKey:
              "Verify RESEND_API_KEY is set in production environment",
            checkDomain:
              "Verify tideraider.com domain is verified in Resend dashboard",
            checkLogs: "Check backend logs for detailed error messages",
          },
        });
      }
    } catch (error) {
      console.error("❌ Error force testing alert:", error);
      return res.status(500).json({
        error: "Failed to test alert",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// GET /api/alerts/:id - Get a specific alert
router.get(
  "/:id",
  authenticateToken,
  validate({ params: getAlertParamsSchema }),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;

      const alert = await AlertService.getAlertById(id);

      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      return res.json(alert);
    } catch (error) {
      console.error("Error fetching alert:", error);
      return res.status(500).json({ error: "Failed to fetch alert" });
    }
  }
);

// PUT /api/alerts/:id - Update an alert
router.put(
  "/:id",
  authenticateToken,
  validate({ params: getAlertParamsSchema, body: updateAlertSchema }),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id: alertId } = req.params;

      // Verify ownership
      await AlertService.verifyAlertOwnership(alertId, authReq.user.id);

      const updatedAlert = await AlertService.updateAlert(alertId, req.body);
      return res.json(updatedAlert);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return res.status(403).json({ error: error.message });
      }
      console.error("Error updating alert:", error);
      return res.status(500).json({ error: "Failed to update alert" });
    }
  }
);

// PATCH /api/alerts/:id - Partial update an alert
router.patch("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id: alertId } = req.params;

    // Verify ownership
    await AlertService.verifyAlertOwnership(alertId, authReq.user.id);

    const updatedAlert = await AlertService.updateAlert(alertId, req.body);

    // Delete alert checks when alert is updated
    await AlertService.deleteAlertChecks(alertId);

    return res.json(updatedAlert);
  } catch (error) {
    console.error("Error updating alert:", error);
    return res.status(500).json({ error: "Failed to update alert" });
  }
});

// DELETE /api/alerts/:id - Delete an alert
router.delete(
  "/:id",
  authenticateToken,
  validate({ params: getAlertParamsSchema }),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id: alertId } = req.params;

      await AlertService.deleteAlert(alertId, authReq.user.id);

      return res.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return res.status(403).json({ error: error.message });
      }
      console.error("Error deleting alert:", error);
      return res.status(500).json({ error: "Failed to delete alert" });
    }
  }
);

export default router;
