import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  authenticateToken,
  optionalAuth,
  AuthRequest,
} from "../middleware/auth";
import { z } from "zod";

// AlertType enum - will be available after Prisma generate
enum AlertType {
  VARIABLES = "VARIABLES",
  RATING = "RATING",
}

// Type for alert creation input
type AlertCreateInput = {
  name: string;
  region: { connect: { id: string } };
  notificationMethod: string;
  contactInfo: string;
  active: boolean;
  user: { connect: { id: string } };
  forecastDate: Date;
  alertType: AlertType;
  starRating?: number | null;
  properties?: {
    create: Array<{
      property: string;
      optimalValue: number;
      range: number;
    }>;
  };
  logEntry?: { connect: { id: string } };
  beach?: { connect: { id: string } };
};

const router = Router();

// Validation schemas
const AlertPropertySchema = z.object({
  property: z.enum([
    "windSpeed",
    "windDirection",
    "swellHeight",
    "swellPeriod",
    "swellDirection",
    "waveHeight",
    "wavePeriod",
    "temperature",
  ]),
  optimalValue: z.number(),
  range: z.number().min(0.1).max(100),
  sourceType: z.enum(["beach_optimal", "log_entry", "custom"]).optional(),
  sourceId: z.string().optional(),
});

const AlertSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Name is required"),
    regionId: z.string().min(1, "Region is required"),
    forecastDate: z.union([z.string(), z.date()]).optional(),
    properties: z.array(AlertPropertySchema).optional(),
    notificationMethod: z.enum(["email", "whatsapp", "both", "app"]),
    contactInfo: z.string().min(1, "Contact information is required"),
    active: z.boolean().default(true),
    logEntryId: z.string().nullable().optional(),
    beachId: z.string().nullable().optional(),
    alertType: z.nativeEnum(AlertType).default(AlertType.VARIABLES),
    starRating: z.number().min(1).max(5).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.alertType === AlertType.VARIABLES) {
        return data.properties && data.properties.length > 0;
      }
      return true;
    },
    {
      message:
        "At least one forecast property is required for VARIABLES alerts",
      path: ["properties"],
    }
  )
  .refine(
    (data) => {
      if (data.alertType === AlertType.RATING) {
        return data.starRating !== null && data.starRating !== undefined;
      }
      return true;
    },
    {
      message: "Star rating is required for RATING alerts",
      path: ["starRating"],
    }
  );

const AVAILABLE_STAR_RATINGS = ["3+", "4+", "5"] as const;

// GET /api/alerts - Fetch alerts, regions, or dates
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { starRatings, region, logEntryId } = req.query;
    const isBetaMode = process.env.NEXT_PUBLIC_APP_MODE === "beta";

    // Return available star ratings
    if (starRatings) {
      return res.json(AVAILABLE_STAR_RATINGS);
    }

    const isAuthenticated = !!authReq.user?.id;

    // Case 0: If logEntryId is provided
    if (logEntryId) {
      if (!isAuthenticated && !isBetaMode) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const logEntry = await prisma.logEntry.findUnique({
        where: { id: logEntryId as string },
        select: {
          forecast: true,
          region: true,
          date: true,
        },
      });

      if (!logEntry) {
        return res.status(404).json({ error: "Log entry not found" });
      }

      let existingAlert = null;
      if (isAuthenticated && authReq.user?.id) {
        existingAlert = await prisma.alert.findFirst({
          where: {
            logEntryId: logEntryId as string,
            userId: authReq.user.id,
          },
        });
      }

      return res.json({
        forecast: logEntry.forecast,
        region: logEntry.region,
        date: logEntry.date,
        ...(existingAlert && { id: existingAlert.id }),
      });
    }

    // Case 1 & 2: Region-related queries
    if (req.query.region !== undefined && !region) {
      const forecasts = await prisma.forecastA.findMany({
        select: {
          regionId: true,
        },
        distinct: ["regionId"],
      });

      const regions = forecasts.map(
        (forecast: { regionId: string }) => forecast.regionId
      );
      return res.json(regions);
    }

    if (region) {
      const forecasts = await prisma.forecastA.findMany({
        where: {
          regionId: region as string,
        },
        select: {
          date: true,
        },
        orderBy: {
          date: "asc",
        },
        distinct: ["date"],
      });

      const dates = forecasts.map(
        (forecast: { date: Date }) => forecast.date.toISOString().split("T")[0]
      );
      return res.json(dates as string[]);
    }

    // Case 3: Fetching user's alerts - return empty array for unauthenticated users
    if (!isAuthenticated || !authReq.user?.id) {
      return res.json([]);
    }

    const alerts = await prisma.alert.findMany({
      where: {
        userId: authReq.user.id,
      },
      include: {
        properties: true,
        region: true,
        logEntry: {
          include: {
            forecast: true,
            beach: true,
          },
        },
        beach: true,
      },
      orderBy: {
        forecastDate: "desc",
      },
    });

    return res.json(alerts);
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Failed to process request" });
  }
});

// POST /api/alerts - Create a new alert
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = AlertSchema.parse(req.body);

    const createInput: AlertCreateInput = {
      name: data.name,
      region: {
        connect: { id: data.regionId },
      },
      notificationMethod: data.notificationMethod,
      contactInfo: data.contactInfo,
      active: data.active,
      user: {
        connect: { id: authReq.user.id },
      },
      forecastDate: new Date(data.forecastDate || Date.now()),
      alertType: data.alertType,
      starRating: data.starRating,
      ...(data.properties &&
        data.properties.length > 0 && {
          properties: {
            create: data.properties.map((prop) => ({
              property: prop.property,
              optimalValue: prop.optimalValue,
              range: prop.range,
            })),
          },
        }),
      ...(data.logEntryId && {
        logEntry: { connect: { id: data.logEntryId } },
      }),
      ...(data.beachId && {
        beach: { connect: { id: data.beachId } },
      }),
    };

    const alert = await prisma.alert.create({
      data: createInput,
      include: {
        properties: true,
        region: true,
        logEntry: {
          include: {
            forecast: true,
            beach: true,
          },
        },
        beach: true,
      },
    });

    return res.json(alert);
  } catch (error) {
    console.error("Alert creation error details:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        issues: error.issues,
      });
    }

    return res.status(500).json({
      error: "Failed to create alert",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/alerts/notify - Process alerts for a user
router.post("/notify", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
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
});

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
      const userAlerts = await prisma.alert.findMany({
        where: {
          userId: authReq.user.id,
          active: true,
        },
        include: {
          logEntry: {
            include: {
              beach: true,
              forecast: true,
            },
          },
          properties: true,
        },
      });

      if (userAlerts.length === 0) {
        return res.status(404).json({
          error: "No active alerts found. Please create an alert first.",
        });
      }

      // Find the alert to test
      const alertToTest = alertId
        ? userAlerts.find((a) => a.id === alertId)
        : userAlerts[0];

      if (!alertToTest) {
        return res.status(404).json({
          error: `Alert with ID ${alertId} not found`,
          availableAlerts: userAlerts.map((a) => ({ id: a.id, name: a.name })),
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
      await prisma.alertNotification.deleteMany({
        where: {
          alertId: alertToTest.id,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(24, 0, 0, 0)),
          },
        },
      });

      // Send the notification
      console.log("📧 Sending test notification to:", alertToTest.contactInfo);
      const { sendAlertNotification } = await import(
        "../services/notificationService"
      );
      const success = await sendAlertNotification(
        mockMatch,
        alertToTest as any,
        beachName
      );

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
          alert: {
            id: alertToTest.id,
            name: alertToTest.name,
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
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        properties: true,
        logEntry: {
          include: {
            forecast: true,
            beach: true,
          },
        },
        beach: true,
        region: true,
      },
    });

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    return res.json(alert);
  } catch (error) {
    console.error("Error fetching alert:", error);
    return res.status(500).json({ error: "Failed to fetch alert" });
  }
});

// PUT /api/alerts/:id - Update an alert
router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id: alertId } = req.params;
    const data = req.body;
    const dateOnly = new Date(data.forecastDate).toISOString().split("T")[0];

    const {
      logEntry,
      logEntryId,
      forecast,
      forecastId,
      id,
      userId,
      properties,
      regionId,
      beachId,
      ...updateData
    } = data;

    const updatedAlert = await prisma.$transaction(async (tx: any) => {
      if (properties && Array.isArray(properties)) {
        await tx.alertProperty.deleteMany({
          where: { alertId },
        });

        await tx.alertProperty.createMany({
          data: properties.map((prop: any) => ({
            alertId,
            property: prop.property,
            optimalValue: prop.optimalValue,
            range: prop.range,
          })),
        });
      }

      const {
        beachId: _beachId,
        regionId: _regionId,
        logEntryId: _logEntryId,
        ...cleanUpdateData
      } = updateData;

      return tx.alert.update({
        where: { id: alertId },
        data: {
          ...cleanUpdateData,
          forecastDate: new Date(dateOnly),
          ...(regionId && {
            region: {
              connect: { id: regionId },
            },
          }),
          ...(beachId
            ? {
                beach: {
                  connect: { id: beachId },
                },
              }
            : beachId === null
              ? {
                  beach: {
                    disconnect: true,
                  },
                }
              : {}),
          ...(logEntryId && {
            logEntry: {
              connect: { id: logEntryId },
            },
          }),
        },
        include: {
          properties: true,
          logEntry: {
            include: {
              forecast: true,
              beach: true,
            },
          },
          beach: true,
          region: true,
        },
      });
    });

    return res.json(updatedAlert);
  } catch (error) {
    console.error("Error updating alert:", error);
    return res.status(500).json({ error: "Failed to update alert" });
  }
});

// PATCH /api/alerts/:id - Partial update an alert
router.patch("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id: alertId } = req.params;
    const data = req.body;

    const AlertUpdateSchema = z.object({
      active: z.boolean().optional(),
      name: z.string().min(1).optional(),
      regionId: z.string().min(1).optional(),
      properties: z
        .array(
          z.object({
            property: z.enum([
              "windSpeed",
              "windDirection",
              "swellHeight",
              "swellPeriod",
              "swellDirection",
            ]),
            optimalValue: z.number(),
            range: z.number().min(0),
          })
        )
        .optional(),
      notificationMethod: z
        .enum(["email", "whatsapp", "app", "both"])
        .optional(),
      contactInfo: z.string().min(1).optional(),
      forecastDate: z.date().optional(),
      alertType: z.enum(["VARIABLES", "RATING"]).optional(),
      starRating: z.number().min(1).max(5).nullable().optional(),
      beachId: z.string().optional(),
    });

    const validationResult = AlertUpdateSchema.safeParse(data);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid alert data",
        details: validationResult.error.format(),
      });
    }

    const existingAlert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId: authReq.user.id,
      },
      include: {
        properties: true,
      },
    });

    if (!existingAlert) {
      return res.status(404).json({ error: "Alert not found or unauthorized" });
    }

    const updatedAlert = await prisma.$transaction(async (tx: any) => {
      if (data.properties) {
        await tx.alertProperty.deleteMany({
          where: { alertId },
        });

        await tx.alertProperty.createMany({
          data: data.properties.map((prop: any) => ({
            alertId,
            property: prop.property,
            optimalValue: prop.optimalValue,
            range: prop.range,
          })),
        });
      }

      return tx.alert.update({
        where: { id: alertId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.regionId && { regionId: data.regionId }),
          ...(data.active !== undefined && { active: data.active }),
          ...(data.notificationMethod && {
            notificationMethod: data.notificationMethod,
          }),
          ...(data.contactInfo && { contactInfo: data.contactInfo }),
          ...(data.beachId && { beachId: data.beachId }),
          ...(data.alertType && { alertType: data.alertType }),
          ...(data.starRating !== undefined && {
            starRating: data.starRating,
          }),
          ...(data.forecastDate && {
            forecastDate: new Date(data.forecastDate),
          }),
        },
        include: {
          properties: true,
          logEntry: {
            include: {
              forecast: true,
              beach: true,
            },
          },
          beach: true,
          region: true,
        },
      });
    });

    await prisma.alertCheck.deleteMany({
      where: { alertId },
    });

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
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id: alertId } = req.params;

      const alert = await prisma.alert.findUnique({
        where: {
          id: alertId,
          userId: authReq.user.id,
        },
      });

      if (!alert) {
        return res
          .status(404)
          .json({ error: "Alert not found or unauthorized" });
      }

      await prisma.$transaction(async (tx: any) => {
        await tx.alertNotification.deleteMany({
          where: { alertId },
        });

        await tx.alertCheck.deleteMany({
          where: { alertId },
        });

        await tx.alertProperty.deleteMany({
          where: { alertId },
        });

        await tx.alert.delete({
          where: { id: alertId },
        });
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting alert:", error);
      return res.status(500).json({ error: "Failed to delete alert" });
    }
  }
);

export default router;
