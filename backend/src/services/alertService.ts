import { prisma } from "../lib/prisma";
import { Prisma, ForecastSource } from "@prisma/client";

export enum AlertType {
  VARIABLES = "VARIABLES",
  RATING = "RATING",
}

export type AlertCreateData = {
  name: string;
  regionId: string;
  forecastDate?: string | Date;
  properties?: Array<{
    property: string;
    optimalValue: number;
    range: number;
  }>;
  notificationMethod: "email" | "whatsapp" | "both" | "app";
  contactInfo: string;
  active?: boolean;
  logEntryId?: string | null;
  beachId?: string | null;
  alertType?: AlertType;
  starRating?: number | null;
  sources?: ForecastSource[];
};

export type AlertUpdateData = {
  name?: string;
  regionId?: string;
  forecastDate?: string | Date;
  properties?: Array<{
    property: string;
    optimalValue: number;
    range: number;
  }>;
  notificationMethod?: "email" | "whatsapp" | "both" | "app";
  contactInfo?: string;
  active?: boolean;
  logEntryId?: string | null;
  beachId?: string | null;
  alertType?: AlertType;
  starRating?: number | null;
  sources?: ForecastSource[];
};

export class AlertService {
  /**
   * Get available star ratings
   */
  static getAvailableStarRatings() {
    return ["3+", "4+", "5"] as const;
  }

  /**
   * Get regions with forecasts
   */
  static async getRegionsWithForecasts() {
    const forecasts = await prisma.forecast.findMany({
      select: {
        regionId: true,
      },
      distinct: ["regionId"],
    });

    return forecasts.map((forecast) => forecast.regionId);
  }

  /**
   * Get available dates for a region
   */
  static async getDatesForRegion(regionId: string) {
    const forecasts = await prisma.forecast.findMany({
      where: {
        regionId,
        source: "WINDFINDER", // Prefer WINDFINDER source
      },
      select: {
        date: true,
      },
      orderBy: {
        date: "asc",
      },
      distinct: ["date"],
    });

    return forecasts.map(
      (forecast) => forecast.date.toISOString().split("T")[0]
    );
  }

  /**
   * Get log entry data for alert creation
   */
  static async getLogEntryForAlert(
    logEntryId: string,
    userId?: string
  ): Promise<{
    forecast: any;
    region: any;
    date: Date;
    existingAlertId?: string;
  } | null> {
    const logEntry = await prisma.logEntry.findUnique({
      where: { id: logEntryId },
      select: {
        forecast: true,
        region: true,
        date: true,
      },
    });

    if (!logEntry) {
      return null;
    }

    let existingAlert = null;
    if (userId) {
      existingAlert = await prisma.alert.findFirst({
        where: {
          logEntryId,
          userId,
        },
      });
    }

    return {
      forecast: logEntry.forecast,
      region: logEntry.region,
      date: logEntry.date,
      ...(existingAlert && { existingAlertId: existingAlert.id }),
    };
  }

  /**
   * Get user's alerts
   */
  static async getUserAlerts(userId: string) {
    return await prisma.alert.findMany({
      where: {
        userId,
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
  }

  /**
   * Create a new alert
   */
  static async createAlert(userId: string, data: AlertCreateData) {
    const createInput: Prisma.AlertCreateInput = {
      name: data.name,
      region: {
        connect: { id: data.regionId },
      },
      notificationMethod: data.notificationMethod,
      contactInfo: data.contactInfo,
      active: data.active ?? true,
      user: {
        connect: { id: userId },
      },
      forecastDate: new Date(data.forecastDate || Date.now()),
      alertType: data.alertType || AlertType.VARIABLES,
      starRating: data.starRating,
      sources: data.sources,
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

    // Trigger background admin notification
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    }).then(user => {
      if (user) {
        import("../lib/adminNotifications").then(({ notifyAdminNewAlert }) => {
          notifyAdminNewAlert(
            user,
            {
              id: alert.id,
              name: alert.name,
              alertType: alert.alertType,
              notificationMethod: alert.notificationMethod,
              starRating: alert.starRating
            }
          ).catch(err => console.error("Error sending admin alert notification:", err));
        }).catch(err => console.error("Failed to load adminNotifications module:", err));
      }
    }).catch(err => console.error("Error fetching user for alert notification:", err));

    return alert;
  }

  /**
   * Get alert by ID
   */
  static async getAlertById(alertId: string) {
    return await prisma.alert.findUnique({
      where: { id: alertId },
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
  }

  /**
   * Update an alert
   */
  static async updateAlert(
    alertId: string,
    data: AlertUpdateData
  ): Promise<any> {
    const dateOnly = data.forecastDate
      ? new Date(data.forecastDate).toISOString().split("T")[0]
      : undefined;

    return await prisma.$transaction(async (tx) => {
      // Update properties if provided
      if (data.properties && Array.isArray(data.properties)) {
        await tx.alertProperty.deleteMany({
          where: { alertId },
        });

        await tx.alertProperty.createMany({
          data: data.properties.map((prop) => ({
            alertId,
            property: prop.property,
            optimalValue: prop.optimalValue,
            range: prop.range,
          })),
        });
      }

      // Build update data
      const updateData: Prisma.AlertUpdateInput = {
        ...(data.name && { name: data.name }),
        ...(data.notificationMethod && {
          notificationMethod: data.notificationMethod,
        }),
        ...(data.contactInfo && { contactInfo: data.contactInfo }),
        ...(typeof data.active === "boolean" && { active: data.active }),
        ...(dateOnly && { forecastDate: new Date(dateOnly) }),
        ...(data.alertType && { alertType: data.alertType }),
        ...(data.starRating !== undefined && { starRating: data.starRating }),
        ...(data.sources && { sources: data.sources }),
        ...(data.regionId && {
          region: {
            connect: { id: data.regionId },
          },
        }),
        ...(data.beachId !== undefined &&
          (data.beachId
            ? {
                beach: {
                  connect: { id: data.beachId },
                },
              }
            : {
                beach: {
                  disconnect: true,
                },
              })),
        ...(data.logEntryId && {
          logEntry: {
            connect: { id: data.logEntryId },
          },
        }),
      };

      return await tx.alert.update({
        where: { id: alertId },
        data: updateData,
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
  }

  /**
   * Delete an alert
   * Deletes all related records (properties, notifications, checks) first to avoid foreign key constraint errors
   */
  static async deleteAlert(alertId: string, userId: string) {
    // Verify ownership
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      select: { userId: true },
    });

    if (!alert) {
      throw new Error("Alert not found");
    }

    if (alert.userId !== userId) {
      throw new Error("Unauthorized to delete this alert");
    }

    // Delete all related records first to avoid foreign key constraint errors
    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete alert properties
      await tx.alertProperty.deleteMany({
        where: { alertId },
      });

      // Delete alert notifications
      await tx.alertNotification.deleteMany({
        where: { alertId },
      });

      // Delete alert checks
      await tx.alertCheck.deleteMany({
        where: { alertId },
      });

      // Finally, delete the alert itself
      await tx.alert.delete({
        where: { id: alertId },
      });
    });

    return { success: true };
  }

  /**
   * Get user's active alerts for testing
   */
  static async getUserActiveAlerts(userId: string) {
    return await prisma.alert.findMany({
      where: {
        userId,
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
  }

  /**
   * Delete today's notifications for an alert (for testing)
   */
  static async deleteTodayNotifications(alertId: string) {
    await prisma.alertNotification.deleteMany({
      where: {
        alertId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(24, 0, 0, 0)),
        },
      },
    });
  }

  /**
   * Check if alert exists and belongs to user
   */
  static async verifyAlertOwnership(alertId: string, userId: string) {
    const existingAlert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId,
      },
    });

    if (!existingAlert) {
      throw new Error("Alert not found or unauthorized");
    }

    return existingAlert;
  }

  /**
   * Delete alert checks for an alert
   */
  static async deleteAlertChecks(alertId: string) {
    await prisma.alertCheck.deleteMany({
      where: { alertId },
    });
  }

  /**
   * Deactivate excess alerts for a user based on their subscription status.
   * Free tier: 1 alert active.
   * Premium tier: 10+ alerts active.
   */
  static async syncAlertStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionStatus: true, hasActiveTrial: true, trialEndDate: true }
    });

    if (!user) return;

    const isTrialActive = user.hasActiveTrial && user.trialEndDate && new Date(user.trialEndDate) > new Date();
    const isPremium = user.subscriptionStatus === "ACTIVE" || isTrialActive;

    if (!isPremium) {
      await this.deactivateExcessAlerts(userId);
    }
  }

  /**
   * Deactivates all alerts except the oldest one for a user.
   */
  static async deactivateExcessAlerts(userId: string) {
    console.log(`[AlertService] Deactivating excess alerts for user: ${userId}`);
    
    // Find all alerts for the user, ordered by creation date (oldest first)
    const alerts = await prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }
    });

    if (alerts.length <= 1) {
      console.log(`[AlertService] User ${userId} has ${alerts.length} alerts. No action needed.`);
      return;
    }

    // Keep the first (oldest) alert active if it was active, 
    // or just ensure only one can be active.
    // Actually, the requirement says "only have their free one as active".
    // We'll keep the oldest one and deactivate the rest.
    const excessAlertIds = alerts.slice(1).map(a => a.id);
    
    await prisma.alert.updateMany({
      where: {
        id: { in: excessAlertIds }
      },
      data: {
        active: false
      }
    });

    console.log(`[AlertService] Deactivated ${excessAlertIds.length} excess alerts for user ${userId}`);
  }
}
