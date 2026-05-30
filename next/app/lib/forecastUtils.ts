export const FORECAST_SOURCE_MAP: Record<string, string> = {
  WINDFINDER: "Windfinder",
  WINDFINDER_SUPER: "Windfinder Super",
  WINDGURU: "Windguru",
  WINDY: "Windy",
  TIDE_RAIDER: "Tide Raider",
  OPENMETEO_ARCHIVE: "OpenMeteo",
};

export const getSourceName = (source?: string): string => {
  if (!source) return "Unknown Source";
  return FORECAST_SOURCE_MAP[source] || source;
};

// ... existing utils ...

export const getWindEmoji = (speed: number | null | undefined): string => {
  if (speed === null || speed === undefined) return "💨"; // Default
  if (speed < 5) return "🪶"; // Light
  if (speed < 12) return "💨"; // Moderate
  if (speed < 20) return "🌪️"; // Strong
  return "⛈️"; // Very strong
};

export function getCardinalDirection(angle: number) {
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
  return directions[Math.round(angle / 22.5) % 16];
}

export const getSwellEmoji = (height: number | null | undefined): string => {
  if (height === null || height === undefined) return "🌊"; // Default
  if (height < 0.5) return "🥱"; // Flat
  if (height < 1) return "🌊"; // Small
  if (height < 2) return "🌊🌊"; // Medium
  return "🌊🌊🌊"; // Large
};

export const getDirectionEmoji = (direction: string | number): string => {
  const deg =
    typeof direction === "string" ? parseInt(direction) || 0 : direction;
  const reversedDeg = (deg + 180) % 360;
  const dirIndex = Math.round(reversedDeg / 45) % 8;
  return ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"][dirIndex] || "➿";
};

export function degreesToCardinal(degrees: number | null | undefined): string {
  if (degrees === null || degrees === undefined) return "N/A";
  const cardinals = [
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
  return cardinals[Math.round((degrees % 360) / 22.5) % 16];
}

export function formatPropertyName(property: string): string {
  switch (property) {
    case "windSpeed":
      return "Wind Speed";
    case "windDirection":
      return "Wind Direction";
    case "swellHeight":
      return "Swell Height";
    case "swellPeriod":
      return "Swell Period";
    case "swellDirection":
      return "Swell Direction";
    default:
      // Handle snake_case or other formats if needed, or just capitalize
      return property.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
  }
}

export function getUnit(property: string): string {
  switch (property) {
    case "windSpeed":
      return "kts";
    case "windDirection":
    case "swellDirection":
      return "°";
    case "swellHeight":
      return "m";
    case "swellPeriod":
      return "s";
    default:
      return "";
  }
}
