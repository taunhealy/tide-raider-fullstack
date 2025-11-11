// Export constants
export const FREE_BEACH_LIMIT = 7;

import type { Beach } from "@/app/types/beaches";
import type { CoreForecastData } from "@/app/types/forecast";

interface ScoreDisplay {
  description: string;
  emoji: string;
  stars: string;
}

const cardinalToDegreesMap: { [key: string]: number } = {
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  ESE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSW: 202.5,
  SW: 225,
  WSW: 247.5,
  W: 270,
  WNW: 292.5,
  NW: 315,
  NNW: 337.5,
};
//convert degrees to cardinal
export function degreesToCardinal(degrees: number | null | string): string {
  if (degrees === null || degrees === undefined || degrees === "") return "N/A";

  const num = Number(degrees);
  if (isNaN(num)) return "N/A";

  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round((num % 360) / 22.5) % 16;

  return directions[index];
}
//get condition reasons
export function getConditionReasons(
  beach: Beach,
  forecastData: CoreForecastData | null,
  includeDetails: boolean = true
) {
  if (!forecastData?.windDirection || !forecastData?.swellDirection) {
    return {
      reasons: [],
      optimalConditions: [
        {
          text: `Optimal Wind: ${beach.optimalWindDirections.join(", ")}`,
          isMet: false,
        },
        {
          text: `Wind Speed: 0-25kts`,
          isMet: false,
        },
        {
          text: `Optimal Swell Direction: ${beach.optimalSwellDirections.min}° - ${beach.optimalSwellDirections.max}°`,
          isMet: false,
        },
        {
          text: `Optimal Wave Size: ${beach.swellSize.min}m - ${beach.swellSize.max}m`,
          isMet: false,
        },
        {
          text: `Optimal Swell Period: ${beach.idealSwellPeriod.min}s - ${beach.idealSwellPeriod.max}s`,
          isMet: false,
        },
      ],
    };
  }

  const reasons = [];

  // Check wind direction
  const windCardinal = degreesToCardinal(forecastData.windDirection);
  const hasGoodWind = beach.optimalWindDirections.includes(windCardinal);
  if (includeDetails ? hasGoodWind : !hasGoodWind) {
    reasons.push(
      includeDetails
        ? `Perfect wind direction (${forecastData.windDirection})`
        : `Wind direction (${forecastData.windDirection}) not optimal`
    );
  }

  // Check swell direction
  const swellDeg = forecastData.swellDirection;
  const minSwellDiff = Math.abs(swellDeg - beach.optimalSwellDirections.min);
  const maxSwellDiff = Math.abs(swellDeg - beach.optimalSwellDirections.max);
  const swellDirDiff = Math.min(minSwellDiff, maxSwellDiff);

  if (
    includeDetails
      ? swellDeg >= beach.optimalSwellDirections.min &&
        swellDeg <= beach.optimalSwellDirections.max
      : !(
          swellDeg >= beach.optimalSwellDirections.min &&
          swellDeg <= beach.optimalSwellDirections.max
        )
  ) {
    reasons.push(
      includeDetails
        ? `Great swell direction (${forecastData.swellDirection}°)`
        : `Swell direction (${forecastData.swellDirection}°) outside optimal range`
    );
  }

  // Check swell height
  const hasGoodSwellHeight =
    forecastData.swellHeight >= beach.swellSize.min &&
    forecastData.swellHeight <= beach.swellSize.max;

  if (includeDetails ? hasGoodSwellHeight : !hasGoodSwellHeight) {
    if (includeDetails) {
      reasons.push(`Perfect wave height (${forecastData.swellHeight}m)`);
    } else {
      const issue =
        forecastData.swellHeight < beach.swellSize.min
          ? "too small"
          : "too big";
      reasons.push(`Wave height (${forecastData.swellHeight}m) ${issue}`);
    }
  }

  // Add optimal conditions section with status
  const optimalConditions = [
    {
      text: `Optimal Wind: ${beach.optimalWindDirections.join(", ")}`,
      isMet: hasGoodWind,
    },
    {
      text: `Wind Speed: 0-25kts${forecastData.windSpeed > 25 && !beach.sheltered ? "" : ""}`,
      isMet: forecastData.windSpeed <= 25 || beach.sheltered,
    },
    {
      text: `Optimal Swell Direction: ${beach.optimalSwellDirections.min}° - ${beach.optimalSwellDirections.max}°`,
      isMet:
        swellDeg >= beach.optimalSwellDirections.min &&
        swellDeg <= beach.optimalSwellDirections.max,
    },
    {
      text: `Optimal Wave Size: ${beach.swellSize.min}m - ${beach.swellSize.max}m`,
      isMet: hasGoodSwellHeight,
    },
    {
      text: `Optimal Swell Period: ${beach.idealSwellPeriod.min}s - ${beach.idealSwellPeriod.max}s`,
      isMet:
        forecastData.swellPeriod >= beach.idealSwellPeriod.min &&
        forecastData.swellPeriod <= beach.idealSwellPeriod.max,
    },
  ];

  return {
    reasons,
    optimalConditions,
  };
}

export function getGatedBeaches(
  beaches: Beach[],
  forecastData: CoreForecastData | null,
  isSubscribed: boolean,
  hasActiveTrial: boolean,
  isBetaMode: boolean = false
) {
  // In Beta mode, show all beaches regardless of subscription status
  if (isBetaMode) {
    return {
      visibleBeaches: beaches,
      lockedBeaches: [],
    };
  }

  // Show all beaches for subscribed users or those in trial
  if (isSubscribed || hasActiveTrial) {
    return {
      visibleBeaches: beaches,
      lockedBeaches: [],
    };
  }

  // For non-subscribed users, show first N beaches
  return {
    visibleBeaches: beaches.slice(0, FREE_BEACH_LIMIT),
    lockedBeaches: beaches.slice(FREE_BEACH_LIMIT),
  };
}

//check if wind direction is similar to optimal directions
export function isWindDirectionSimilar(
  windDirection: string,
  optimalDirections: string[]
): boolean {
  // Normalize the wind direction before comparison
  const normalizedWind = windDirection.trim().toUpperCase();
  const normalizedOptimal = optimalDirections.map((d) =>
    d.trim().toUpperCase()
  );

  return normalizedOptimal.some((optimal) => normalizedWind === optimal);
}
