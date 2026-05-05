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
  const windDirs = beach.optimalWindDirections || [];
  const swellDirs = beach.optimalSwellDirections || { min: 0, max: 360 };
  const swellSz = beach.swellSize || { min: 0, max: 10 };
  const swellPd = beach.idealSwellPeriod || { min: 0, max: 25 };

  if (forecastData?.windDirection === undefined || forecastData?.swellDirection === undefined || forecastData === null) {
    return {
      reasons: [],
      optimalConditions: [
        {
          text: `Optimal Wind: ${windDirs.join(", ")}`,
          isMet: false,
        },
        {
          text: `Wind Speed: 0-25kts`,
          isMet: false,
        },
        {
          text: `Optimal Swell Direction: ${swellDirs.min}° - ${swellDirs.max}°`,
          isMet: false,
        },
        {
          text: `Optimal Wave Size: ${swellSz.min}m - ${swellSz.max}m`,
          isMet: false,
        },
        {
          text: `Optimal Swell Period: ${swellPd.min}s - ${swellPd.max}s`,
          isMet: false,
        },
      ],
    };
  }

  const reasons = [];

  // Check wind direction
  const windCardinal = degreesToCardinal(forecastData.windDirection);
  const hasGoodWind = windDirs.includes(windCardinal);
  if (includeDetails ? hasGoodWind : !hasGoodWind) {
    reasons.push(
      includeDetails
        ? `Perfect wind direction (${forecastData.windDirection})`
        : `Wind direction (${forecastData.windDirection}) not optimal`
    );
  }

  // Check swell direction
  const swellDeg = forecastData.swellDirection;
  const minSwellDiff = Math.abs(swellDeg - swellDirs.min);
  const maxSwellDiff = Math.abs(swellDeg - swellDirs.max);
  const swellDirDiff = Math.min(minSwellDiff, maxSwellDiff);

  if (
    includeDetails
      ? swellDeg >= swellDirs.min &&
        swellDeg <= swellDirs.max
      : !(
          swellDeg >= swellDirs.min &&
          swellDeg <= swellDirs.max
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
    forecastData.swellHeight >= swellSz.min &&
    forecastData.swellHeight <= swellSz.max;

  if (includeDetails ? hasGoodSwellHeight : !hasGoodSwellHeight) {
    if (includeDetails) {
      reasons.push(`Perfect wave height (${forecastData.swellHeight}m)`);
    } else {
      const issue =
        forecastData.swellHeight < swellSz.min
          ? "too small"
          : "too big";
      reasons.push(`Wave height (${forecastData.swellHeight}m) ${issue}`);
    }
  }

  // Add optimal conditions section with status
  const optimalConditions = [
    {
      text: `Optimal Wind: ${windDirs.join(", ")}`,
      isMet: hasGoodWind,
    },
    {
      text: `Wind Speed: 0-25kts${forecastData.windSpeed > 25 && !beach.sheltered ? "" : ""}`,
      isMet: forecastData.windSpeed <= 25 || beach.sheltered,
    },
    {
      text: `Optimal Swell Direction: ${swellDirs.min}° - ${swellDirs.max}°`,
      isMet:
        swellDeg >= swellDirs.min &&
        swellDeg <= swellDirs.max,
    },
    {
      text: `Optimal Wave Size: ${swellSz.min}m - ${swellSz.max}m`,
      isMet: hasGoodSwellHeight,
    },
    {
      text: `Optimal Swell Period: ${swellPd.min}s - ${swellPd.max}s`,
      isMet:
        forecastData.swellPeriod >= swellPd.min &&
        forecastData.swellPeriod <= swellPd.max,
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
