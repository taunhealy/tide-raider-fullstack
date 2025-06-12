import type { Beach } from "@/app/types/beaches";
import type { BaseForecastData, CoreForecastData } from "@/app/types/forecast";
import { degreesToCardinal, cardinalToDegreesMap } from "./directionUtils";
import { BeachWithScore } from "../types/scores";

interface ScoreDisplay {
  description: string;
  emoji: string;
  stars: string;
}

// Add type guards
const isValidSwellRange = (obj: any): obj is { min: number; max: number } => {
  return (
    obj &&
    typeof obj === "object" &&
    "min" in obj &&
    "max" in obj &&
    typeof obj.min === "number" &&
    typeof obj.max === "number" &&
    !isNaN(obj.min) &&
    !isNaN(obj.max)
  );
};

// Calculate the score for a single beach
export function calculateBeachScore(
  beach: Beach,
  conditions: CoreForecastData
): { score: number } {
  // Add initial debug log
  console.log(`Scoring ${beach.name}:`, {
    input: {
      beach: {
        optimalWinds: beach.optimalWindDirections,
        optimalSwellRange: beach.optimalSwellDirections,
      },
      conditions: {
        wind: {
          direction: conditions.windDirection,
          cardinal: degreesToCardinal(conditions.windDirection),
        },
        swell: {
          direction: conditions.swellDirection,
          height: conditions.swellHeight,
          period: conditions.swellPeriod,
        },
      },
    },
  });

  // Add detailed logging for input data
  console.log(`🔍 Detailed score calculation for ${beach.name}:`, {
    wind: {
      current: conditions.windDirection,
      cardinal: degreesToCardinal(conditions.windDirection),
      optimal: beach.optimalWindDirections,
      speed: conditions.windSpeed,
    },
    swell: {
      height: { current: conditions.swellHeight, optimal: beach.swellSize },
      direction: {
        current: conditions.swellDirection,
        optimal: beach.optimalSwellDirections,
      },
      period: {
        current: conditions.swellPeriod,
        optimal: beach.idealSwellPeriod,
      },
    },
  });

  // Basic validation
  if (!beach) {
    console.error("❌ Missing beach data");
    return { score: 0 };
  }

  try {
    // Validate beach data structure with detailed logging
    const validationErrors = [];

    if (!Array.isArray(beach.optimalWindDirections)) {
      validationErrors.push("optimalWindDirections is not an array");
    }
    if (!isValidSwellRange(beach.swellSize)) {
      validationErrors.push("invalid swellSize range");
    }
    if (!isValidSwellRange(beach.optimalSwellDirections)) {
      validationErrors.push("invalid optimalSwellDirections range");
    }
    if (!isValidSwellRange(beach.idealSwellPeriod)) {
      validationErrors.push("invalid idealSwellPeriod range");
    }

    if (validationErrors.length > 0) {
      console.error("Invalid beach data structure for beach:", {
        beachId: beach.id,
        beachName: beach.name,
        errors: validationErrors,
        data: {
          optimalWindDirections: beach.optimalWindDirections,
          swellSize: beach.swellSize,
          optimalSwellDirections: beach.optimalSwellDirections,
          idealSwellPeriod: beach.idealSwellPeriod,
        },
      });
      return { score: 0 };
    }

    // Starting score
    let score = 5;
    let scoreLog = [];

    // Wind direction check
    const currentDirDegrees = Number(conditions.windDirection);
    const windCardinal = degreesToCardinal(currentDirDegrees);

    // Add detailed wind calculations logging
    console.log("Wind direction check:", {
      beach: beach.name,
      currentWind: {
        cardinal: windCardinal,
        degrees: currentDirDegrees,
      },
      optimalDirections: beach.optimalWindDirections,
      isOptimal: beach.optimalWindDirections.includes(windCardinal),
    });

    console.log("Detailed wind angle calculations:", {
      currentWind: {
        degrees: currentDirDegrees, // 291.5
        cardinal: windCardinal, // WNW
      },
      optimalWinds: beach.optimalWindDirections.map((dir) => ({
        direction: dir,
        degrees: cardinalToDegreesMap[dir],
        difference: Math.abs(currentDirDegrees - cardinalToDegreesMap[dir]),
      })),
    });

    if (!beach.optimalWindDirections.includes(windCardinal)) {
      // Calculate minimum angle difference from any optimal direction
      const minAngleDiff = beach.optimalWindDirections.reduce(
        (minDiff, optimalDir) => {
          const optimalDegrees = cardinalToDegreesMap[optimalDir];
          const diff = Math.abs(currentDirDegrees - optimalDegrees);
          const angleDiff = Math.min(diff, 360 - diff);
          return Math.min(minDiff, angleDiff);
        },
        180
      ); // Start with max possible difference

      if (minAngleDiff <= 22.5) {
        // Neighboring direction
        score = Math.max(0, score - 1);
        scoreLog.push("Wind direction neighboring optimal (-1)");
      } else if (minAngleDiff <= 45) {
        // Significantly off
        score = Math.max(0, score - 2);
        scoreLog.push("Wind direction off (-2)");
      } else if (minAngleDiff <= 90) {
        // Very off
        score = Math.max(0, score - 3);
        scoreLog.push("Wind direction very off (-3)");
      } else {
        // Completely wrong direction (cross/onshore when should be offshore)
        score = Math.max(0, score - 4);
        scoreLog.push("Wind direction completely wrong (-4)");
      }
    } else {
      scoreLog.push("Wind direction optimal (no deduction)");
    }

    // Wind strength scoring
    if (!beach.sheltered) {
      if (conditions.windSpeed > 35) {
        score = Math.max(0, score - 2);
        scoreLog.push("Wind too strong >35kts (-2)");
      } else if (conditions.windSpeed > 25) {
        score = Math.max(0, score - 1.5);
        scoreLog.push("Wind strong >25kts (-1.5)");
      } else {
        scoreLog.push("Wind speed optimal (no deduction)");
      }
    }

    // Wave size scoring
    if (
      !(
        conditions.swellHeight >= beach.swellSize.min &&
        conditions.swellHeight <= beach.swellSize.max
      )
    ) {
      const heightDiff = Math.min(
        Math.abs(conditions.swellHeight - beach.swellSize.min),
        Math.abs(conditions.swellHeight - beach.swellSize.max)
      );
      if (heightDiff <= 0.5) {
        score = Math.max(0, score - 1);
        scoreLog.push("Wave height just outside range (-1)");
      } else if (heightDiff <= 1) {
        score = Math.max(0, score - 2);
        scoreLog.push("Wave height significantly off (-2)");
      } else {
        score = Math.max(0, score - 3);
        scoreLog.push("Wave height way off (-3)");
      }
    } else {
      scoreLog.push("Wave height optimal (no deduction)");
    }

    // Swell direction scoring
    const swellDeg = Number(conditions.swellDirection);
    if (
      !(
        swellDeg >= beach.optimalSwellDirections.min &&
        swellDeg <= beach.optimalSwellDirections.max
      )
    ) {
      const minSwellDiff = Math.abs(
        swellDeg - beach.optimalSwellDirections.min
      );
      const maxSwellDiff = Math.abs(
        swellDeg - beach.optimalSwellDirections.max
      );
      const swellDirDiff = Math.min(minSwellDiff, maxSwellDiff);

      if (swellDirDiff <= 10) {
        score = Math.max(0, score - 1);
        scoreLog.push("Swell direction slightly off (-1)");
      } else if (swellDirDiff <= 20) {
        score = Math.max(0, score - 2);
        scoreLog.push("Swell direction off (-2)");
      } else if (swellDirDiff <= 30) {
        score = Math.max(0, score - 3);
        scoreLog.push("Swell direction very off (-3)");
      } else {
        score = Math.max(0, score - 4);
        scoreLog.push("Swell direction completely off (-4)");
      }
    } else {
      scoreLog.push("Swell direction optimal (no deduction)");
    }

    // Swell period scoring
    if (
      !(
        conditions.swellPeriod >= beach.idealSwellPeriod.min &&
        conditions.swellPeriod <= beach.idealSwellPeriod.max
      )
    ) {
      const periodDiff = Math.min(
        Math.abs(conditions.swellPeriod - beach.idealSwellPeriod.min),
        Math.abs(conditions.swellPeriod - beach.idealSwellPeriod.max)
      );
      if (periodDiff <= 2) {
        score = Math.max(0, score - 1);
      } else {
        score = Math.max(0, score - 2);
      }
    }

    // Log final score and breakdown
    console.log(`📊 Score breakdown for ${beach.name}:`, {
      finalScore: score,
      deductions: scoreLog,
    });

    return { score };
  } catch (error) {
    console.error("Error calculating beach score:", error);
    return { score: 0 };
  }
}

export function calculateRegionScores(
  beaches: Beach[],
  selectedRegion: string | null,
  forecastData: BaseForecastData | null
): Record<
  string,
  { score: number; region: string; conditions: CoreForecastData }
> {
  const scores: Record<
    string,
    { score: number; region: string; conditions: CoreForecastData }
  > = {};

  if (!forecastData || !beaches.length) return scores;

  beaches.forEach((beach) => {
    if (
      selectedRegion &&
      selectedRegion !== "Global" &&
      beach.region?.name !== selectedRegion
    ) {
      return;
    }

    const processedConditions: CoreForecastData = {
      windSpeed: forecastData.windSpeed,
      windDirection: forecastData.windDirection,
      swellHeight: forecastData.swellHeight,
      swellDirection: forecastData.swellDirection,
      swellPeriod: forecastData.swellPeriod,
    };

    const { score } = calculateBeachScore(beach, processedConditions);
    scores[beach.id] = {
      score,
      region: beach.region?.name || "Unknown",
      conditions: processedConditions,
    };
  });

  return scores;
}

export function getSortedBeachesByScore(
  beaches: Beach[],
  beachScores: Record<string, { score: number; region: string }>
): BeachWithScore[] {
  return [...beaches]
    .map((beach) => ({
      ...beach,
      score: beachScores[beach.id]?.score || 0,
    }))
    .sort((a, b) => b.score - a.score);
}

export function getScoreDisplay(score: number): ScoreDisplay {
  const roundedScore = Math.round(score * 2) / 2;

  switch (Math.floor(roundedScore)) {
    case 5:
      return { description: "Yeeeew!", emoji: "🤩🔥", stars: "⭐".repeat(5) };
    case 4:
      return { description: "Surfs up?!", emoji: "🏄‍♂️", stars: "⭐".repeat(4) };
    case 3:
      return {
        description: "Maybe, baby?",
        emoji: "👻",
        stars: "⭐".repeat(3),
      };
    case 2:
      return {
        description: "Probably dog kak",
        emoji: "🐶💩",
        stars: "⭐".repeat(2),
      };
    case 1:
      return { description: "Dog kak", emoji: "💩", stars: "⭐".repeat(1) };
    case 0:
      return { description: "Horse kak", emoji: "🐎💩", stars: "" };
    default:
      return { description: "?", emoji: "🐎💩", stars: "" };
  }
}
