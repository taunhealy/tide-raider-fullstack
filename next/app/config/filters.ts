import { Beach } from "@/app/types/beaches";
import { FilterConfig } from "@/app/types/filters";

// UI-specific enums for filters
const WAVE_TYPES = {
  BEACH_BREAK: "BEACH_BREAK",
  POINT_BREAK: "POINT_BREAK",
  REEF_BREAK: "REEF_BREAK",
  RIVER_MOUTH: "RIVER_MOUTH",
} as const;

const DIFFICULTY = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
  EXPERT: "EXPERT",
} as const;

export const FILTERS: FilterConfig[] = [
  {
    key: "waveTypes",
    type: "array",
    label: "Wave Type",
    options: Object.values(WAVE_TYPES),
    urlParam: "waveType",
    beachProp: "waveType",
    displayNames: {
      [WAVE_TYPES.BEACH_BREAK]: "Beach Break",
      [WAVE_TYPES.POINT_BREAK]: "Point Break",
      [WAVE_TYPES.REEF_BREAK]: "Reef Break",
      [WAVE_TYPES.RIVER_MOUTH]: "River Mouth",
    },
  },
  {
    key: "difficulty",
    type: "array",
    label: "Difficulty",
    options: Object.values(DIFFICULTY),
    urlParam: "difficulty",
    beachProp: "difficulty",
    displayNames: {
      [DIFFICULTY.BEGINNER]: "Beginner",
      [DIFFICULTY.INTERMEDIATE]: "Intermediate",
      [DIFFICULTY.ADVANCED]: "Advanced",
      [DIFFICULTY.EXPERT]: "Expert",
    },
  },
  {
    key: "optimalTide",
    type: "array",
    label: "Optimal Tide",
    options: [
      "LOW",
      "MID",
      "HIGH",
      "ALL",
      "LOW_TO_MID",
      "MID_TO_HIGH",
      "UNKNOWN",
    ],
    urlParam: "optimalTide",
    beachProp: "optimalTide",
    displayNames: {
      LOW: "Low",
      MID: "Mid",
      HIGH: "High",
    },
  },
  {
    key: "bestSeasons",
    type: "array",
    label: "Best Season",
    options: ["Summer", "Autumn", "Winter", "Spring"],
    urlParam: "bestSeasons",
    beachProp: "bestSeasons",
  },
];
