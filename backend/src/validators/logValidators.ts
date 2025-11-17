import { z } from "zod";

export const createLogSchema = z
  .object({
    date: z.union([z.string(), z.date()]),
    region: z.string().min(1, "Region is required"),
    forecast: z.object({
      windSpeed: z.number(),
      windDirection: z.number(),
      swellHeight: z.number(),
      swellPeriod: z.number(),
      swellDirection: z.number(),
    }),
    // Allow other fields to pass through
  })
  .passthrough();

export const getLogParamsSchema = z.object({
  id: z.string().uuid("Invalid log entry ID"),
});

export const createRaidLogSchema = z.object({
  beachName: z.string().min(1, "Beach name is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  surferName: z.string().min(1, "Surfer name is required"),
  surferEmail: z.string().email("Invalid email address"),
  surferRating: z.number().min(0).max(5),
  comments: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  videoPlatform: z.string().nullable().optional(), // Allow null for uploaded videos
  isPrivate: z.boolean().optional(),
  isAnonymous: z.boolean().optional(),
  waveType: z.string().optional(),
  beachId: z.string().uuid().optional(),
  regionId: z.string().min(1, "Region ID is required"), // Accepts UUID or slug
  forecastId: z.string().uuid().optional(),
  forecast: z
    .object({
      wind: z.object({
        speed: z.number(),
        direction: z.string(),
      }),
      swell: z.object({
        height: z.number(),
        period: z.number(),
        direction: z.string(),
        cardinalDirection: z.string().optional(),
      }),
      timestamp: z.number(),
    })
    .optional(),
  continent: z.string().optional(),
  country: z.string().optional(),
});

export const updateRaidLogSchema = z.object({
  id: z.string().uuid("Invalid log entry ID"),
  surferName: z.string().optional(),
  surferEmail: z.string().email().optional(),
  surferRating: z.number().min(0).max(5).optional(),
  comments: z.string().optional(),
  isPrivate: z.boolean().optional(),
  isAnonymous: z.boolean().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  videoPlatform: z.string().nullable().optional(), // Allow null for uploaded videos
  waveType: z.string().optional(),
  beachId: z.string().uuid().optional(),
  beachName: z.string().optional(),
  regionId: z.string().min(1).optional(), // Accepts UUID or slug
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  forecastId: z.string().uuid().optional(),
});

export const deleteRaidLogQuerySchema = z.object({
  id: z.string().uuid("Invalid log entry ID"),
});

export const getRaidLogsQuerySchema = z.object({
  id: z.string().uuid().optional(),
  beaches: z.string().optional(),
  regions: z.string().optional(),
  regionId: z.string().optional(),
  countries: z.string().optional(),
  minRating: z
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().min(0).max(5))
    .optional(),
  maxRating: z
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().min(0).max(5))
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().int().positive())
    .optional(),
  limit: z
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().int().positive())
    .optional(),
  isPrivate: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  userId: z.string().uuid().optional(),
  // beachId can be either a UUID or a beach slug (e.g., "nusa-dua", "bingin")
  beachId: z.string().optional(),
});
