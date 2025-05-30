import type { Beach } from "@/app/types/beaches";
import type { CoreForecastData } from "@/app/types/forecast";
import { degreesToCardinal, cardinalToDegreesMap } from "./directionUtils";

export function calculateBeachScore(
  beach: Beach,
  conditions: CoreForecastData
): { score: number; suitable: boolean } {
  // Basic validation
  if (!beach) {
    console.log("Missing beach data");
    return { score: 0, suitable: false };
  }

  try {
    console.log("Beach:", beach.id, "Conditions:", JSON.stringify(conditions));

    // Check for required beach properties
    if (
      !beach.optimalWindDirections ||
      !beach.swellSize ||
      !beach.optimalSwellDirections ||
      !beach.idealSwellPeriod
    ) {
      console.log(
        "Beach missing required properties:",
        beach.id,
        "optimalWindDirections:",
        !!beach.optimalWindDirections,
        "swellSize:",
        !!beach.swellSize,
        "optimalSwellDirections:",
        !!beach.optimalSwellDirections,
        "idealSwellPeriod:",
        !!beach.idealSwellPeriod
      );
      return { score: 0, suitable: false };
    }

    let score = 10;

    // Convert numeric degrees to cardinal direction
    const currentDirDegrees = Number(conditions.windDirection);
    const windCardinal = degreesToCardinal(currentDirDegrees);

    // Smarter wind direction check
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

    // Check wind strength separately
    if (!beach.sheltered) {
      if (conditions.windSpeed > 35) {
        score = Math.max(0, score - 4);
      } else if (conditions.windSpeed > 25) {
        score = Math.max(0, score - 3);
      } else if (conditions.windSpeed > 15) {
        score = Math.max(0, score - 2);
      }
    }

    // Check wave size with significant penalties
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

    // Check swell direction with graduated penalties
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

    // Check swell period with graduated penalties
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
      // For periods in the upper half of the ideal range
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

    // Always return a valid score object
    const finalScore = Math.max(0, Math.min(5, score / 2));
    return {
      score: finalScore,
      suitable: finalScore >= 4,
    };
  } catch (error) {
    console.error("Error calculating beach score:", error);
    return { score: 0, suitable: false };
  }
}

export function calculateAllBeachScores(
  beaches: Beach[],
  conditions: CoreForecastData
): Record<string, { score: number; suitable: boolean; region: string }> {
  const result: Record<
    string,
    { score: number; suitable: boolean; region: string }
  > = {};

  for (const beach of beaches) {
    const { score, suitable } = calculateBeachScore(beach, conditions);
    result[beach.id] = {
      score,
      suitable,
      region: beach.region || "",
    };
  }

  return result;
}

export function isBeachSuitable(
  beach: Beach,
  conditions: CoreForecastData
): boolean {
  const { score } = calculateBeachScore(beach, conditions);
  return score >= 4;
}
