import { z } from "zod";
import { AlertType } from "../services/alertService";

export const alertPropertySchema = z.object({
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

export const createAlertSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Name is required"),
    regionId: z.string().min(1, "Region is required"),
    forecastDate: z.union([z.string(), z.date()]).optional(),
    properties: z.array(alertPropertySchema).optional(),
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

export const updateAlertSchema = z.object({
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
  notificationMethod: z.enum(["email", "whatsapp", "app", "both"]).optional(),
  contactInfo: z.string().min(1).optional(),
  forecastDate: z.union([z.string(), z.date()]).optional(),
  alertType: z.enum(["VARIABLES", "RATING"]).optional(),
  starRating: z.number().min(1).max(5).nullable().optional(),
  beachId: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export const getAlertParamsSchema = z.object({
  id: z.string().uuid("Invalid alert ID"),
});

export const getAlertsQuerySchema = z.object({
  starRatings: z.string().optional(),
  region: z.string().optional(),
  logEntryId: z.string().uuid().optional(),
});

export const notifyAlertsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const testForceAlertQuerySchema = z.object({
  alertId: z.string().uuid().optional(),
});
