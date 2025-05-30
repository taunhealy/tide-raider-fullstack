export const cardinalToDegreesMap: { [key: string]: number } = {
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
