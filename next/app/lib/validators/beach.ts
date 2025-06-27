import { z } from "zod";

export const OptimalTideEnum = z.enum([
  "Low",
  "Mid",
  "High",
  "All",
  "Low_to_Mid",
  "Mid_to_High",
  "unknown",
]);

export const BeachSchema = z.object({
  id: z.string(),
  name: z.string(),
  optimalTide: OptimalTideEnum,
  difficulty: z.enum([
    "Beginner",
    "Intermediate",
    "Advanced",
    "All Levels",
    "Expert",
  ]),
  waveType: z.enum([
    "Beach Break",
    "Reef Break",
    "Point Break",
    "Beach and Reef Break",
    "Beach and Point Break",
  ]),
  optimalSwellDirections: z.object({
    min: z.number(),
    max: z.number(),
    cardinal: z.string().optional(),
  }),
  // ... other fields
});

export type Beach = z.infer<typeof BeachSchema>;
