import type { Beach } from "@/app/types/beaches";
import type { BaseForecastData, CoreForecastData } from "@/app/types/forecast";
import { degreesToCardinal, cardinalToDegreesMap } from "./directionUtils";

interface ScoreDisplay {
  description: string;
  emoji: string;
  stars: string;
}

// Add type guards
const isValidSwellRange = (obj: any): obj is { min: number; max: number } => {
  return obj && typeof obj.min === "number" && typeof obj.max === "number";
};

// Calculate the score for a single beach
export function calculateBeachScore(
  beach: Beach,
  conditions: CoreForecastData
): { score: number } {
  console.log("🎯 Calculating score for beach:", {
    beachId: beach.id,
    beachName: beach.name,
    beachRegion: beach.region,
    conditions,
    beachCriteria: {
      optimalWindDirections: beach.optimalWindDirections,
      swellSize: beach.swellSize,
      optimalSwellDirections: beach.optimalSwellDirections,
      idealSwellPeriod: beach.idealSwellPeriod,
    },
  });

  console.log(`🏖️ Calculating score for beach: ${beach.name} (${beach.id})`);
  console.log("Input conditions:", {
    wind: `${conditions.windSpeed}kts ${conditions.windDirection}°`,
    swell: `${conditions.swellHeight}m ${conditions.swellDirection}° ${conditions.swellPeriod}s`,
  });
  console.log("Beach criteria:", {
    windDirs: beach.optimalWindDirections,
    swellSize: beach.swellSize,
    swellDirs: beach.optimalSwellDirections,
    period: beach.idealSwellPeriod,
  });

  // Basic validation
  if (!beach) {
    console.log("❌ Missing beach data");
    return { score: 0 };
  }

  try {
    // Single consolidated validation block
    if (
      !Array.isArray(beach.optimalWindDirections) ||
      !isValidSwellRange(beach.swellSize) ||
      !isValidSwellRange(beach.optimalSwellDirections) ||
      !isValidSwellRange(beach.idealSwellPeriod)
    ) {
      console.error("Invalid beach data structure for beach:", beach.id, {
        optimalWindDirections: beach.optimalWindDirections,
        swellSize: beach.swellSize,
        optimalSwellDirections: beach.optimalSwellDirections,
        idealSwellPeriod: beach.idealSwellPeriod,
      });
      return { score: 0 };
    }

    // Starting score
    let score = 10;

    // Convert numeric degrees to cardinal direction
    const currentDirDegrees = Number(conditions.windDirection);
    const windCardinal = degreesToCardinal(currentDirDegrees);

    // Wind direction scoring
    if (!beach.optimalWindDirections.includes(windCardinal)) {
      // Convert both directions to degrees for comparison
      const isNeighboring = beach.optimalWindDirections.some((optimalDir) => {
        const optimalDegrees = cardinalToDegreesMap[optimalDir];
        if (optimalDegrees === undefined) return false;

        // Calculate the smallest angle between the two directions
        const diff = Math.abs(currentDirDegrees - optimalDegrees);
        const angleDiff = Math.min(diff, 360 - diff);

        return angleDiff <= 45;
      });

      if (isNeighboring) {
        score = Math.max(0, score - 2);
      } else {
        score = Math.max(0, score - 4);
      }
    }

    // Wind strength scoring
    if (!beach.sheltered) {
      if (conditions.windSpeed > 35) {
        score = Math.max(0, score - 4);
      } else if (conditions.windSpeed > 25) {
        score = Math.max(0, score - 3);
      } else if (conditions.windSpeed > 15) {
        score = Math.max(0, score - 2);
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
        score = Math.max(0, score - 4); // Just outside range
      } else if (heightDiff <= 1) {
        score = Math.max(0, score - 6); // Significantly off
      } else {
        score = Math.max(0, score - 8); // Way too big/small
      }
    }

    // Swell direction scoring
    const swellDeg = conditions.swellDirection;
    const minSwellDiff = Math.abs(swellDeg - beach.optimalSwellDirections.min);
    const maxSwellDiff = Math.abs(swellDeg - beach.optimalSwellDirections.max);
    const swellDirDiff = Math.min(minSwellDiff, maxSwellDiff);

    if (
      !(
        swellDeg >= beach.optimalSwellDirections.min &&
        swellDeg <= beach.optimalSwellDirections.max
      )
    ) {
      if (swellDirDiff <= 10) {
        score = Math.max(0, score - 2);
      } else if (swellDirDiff <= 20) {
        score = Math.max(0, score - 4);
      } else if (swellDirDiff <= 30) {
        score = Math.max(0, score - 6);
      } else {
        score = Math.max(0, score - 8);
      }
    }

    // Swell period scoring
    const periodDiff = Math.min(
      Math.abs(conditions.swellPeriod - beach.idealSwellPeriod.min),
      Math.abs(conditions.swellPeriod - beach.idealSwellPeriod.max)
    );

    if (
      !(
        conditions.swellPeriod >= beach.idealSwellPeriod.min &&
        conditions.swellPeriod <= beach.idealSwellPeriod.max
      )
    ) {
      if (periodDiff <= 2) {
        score = Math.max(0, score - 2);
      } else if (periodDiff <= 4) {
        score = Math.max(0, score - 4);
      } else {
        score = Math.max(0, score - 6);
      }
    } else {
      // Add bonus points for exceptionally good swell periods
      const midPoint =
        (beach.idealSwellPeriod.min + beach.idealSwellPeriod.max) / 2;
      if (conditions.swellPeriod > midPoint) {
        // Add up to 2 bonus points for excellent swell periods
        const bonusRatio =
          (conditions.swellPeriod - midPoint) /
          (beach.idealSwellPeriod.max - midPoint);
        const bonus = Math.min(2, Math.max(0, bonusRatio * 2));
        score = Math.min(10, score + bonus);
      }
    }

    // Calculate final score (scaled to 0-5 range)
    const finalScore = Math.max(0, Math.min(5, score / 2));

    // Add logging before final return
    console.log(
      `✅ Final score for ${beach.name}: ${finalScore}/5 (${finalScore >= 4 ? "Suitable" : "Not Suitable"})`
    );
    return { score: finalScore };
  } catch (error) {
    console.error("Error calculating beach score for beach:", beach.id);
    console.error("Error details:", error);
    console.error("Beach data:", JSON.stringify(beach, null, 2));
    console.error("Conditions:", JSON.stringify(conditions, null, 2));
    return { score: 0 };
  }
}

// Calculate scores for all beaches based on calculateBeachScore function
export function calculateAllBeachScores(
  beaches: Beach[],
  conditions: CoreForecastData
): Record<string, { score: number; region: string }> {
  console.log("🎯 Calculating all beach scores:", {
    beachCount: beaches.length,
    conditions,
    sampleBeach: beaches[0],
  });

  const result: Record<string, { score: number; region: string }> = {};

  beaches.forEach((beach) => {
    const { score } = calculateBeachScore(beach, conditions);
    result[beach.id] = {
      score,
      region: beach.region.name,
    };
  });

  console.log("🎯 Score calculation results:", {
    totalScores: Object.keys(result).length,
    sampleScore: Object.entries(result)[0],
  });

  return result;
}

// Score display interface and function

export function getScoreDisplay(score: number): ScoreDisplay {
  // Use floor instead of round to prevent 3.5 → 4
  const flooredScore = Math.floor(score);

  const getStars = (count: number) => "⭐".repeat(count);

  switch (flooredScore) {
    case 5:
      return {
        description: "Yeeeew!",
        emoji: "🤩🔥",
        stars: getStars(5),
      };
    case 4:
      return {
        description: "Surfs up?!",
        emoji: "🏄‍♂️",
        stars: getStars(4),
      };
    case 3:
      return {
        description: "Maybe, baby?",
        emoji: "👻",
        stars: getStars(3),
      };
    case 2:
      return {
        description: "Probably dog kak",
        emoji: "🐶💩",
        stars: getStars(2),
      };
    case 1:
      return {
        description: "Dog kak",
        emoji: "💩",
        stars: getStars(1),
      };
    case 0:
      return {
        description: "Horse kak",
        emoji: "🐎💩",
        stars: "",
      };
    default:
      return {
        description: "?",
        emoji: "🐎💩",
        stars: "",
      };
  }
}

//calculate region scores
export function calculateRegionScores(
  beaches: Beach[],
  selectedRegion: string | null,
  forecastData: BaseForecastData | null
): Record<string, { score: number; region: string }> {
  const scores: Record<string, { score: number; region: string }> = {};

  if (!forecastData || !beaches.length) return scores;

  // For each beach, calculate the score
  beaches.forEach((beach) => {
    // If selectedRegion is provided and not "Global", only process beaches in that region
    if (
      selectedRegion &&
      selectedRegion !== "Global" &&
      beach.region.name !== selectedRegion
    ) {
      return;
    }

    // When processing the forecast data, strip it down to just the required fields
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
      region: beach.region.name,
    };
  });

  return scores;
}

export function calculateRegionCounts(
  beachScores: Record<string, { score: number; region: string }>
): Record<string, number> {
  const counts: Record<string, number> = {};

  Object.values(beachScores).forEach((beachData) => {
    if (beachData.score >= 4) {
      const region = beachData.region;
      counts[region] = (counts[region] || 0) + 1;
    }
  });

  return counts;
}
