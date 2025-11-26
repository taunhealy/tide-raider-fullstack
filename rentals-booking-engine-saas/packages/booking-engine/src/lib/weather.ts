/**
 * WeatherAPI.com integration for dynamic pricing
 * Free tier: 1M calls/month
 */

export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      code: number;
    };
    wind_kph: number;
    precip_mm: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
  };
}

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_BASE_URL = "https://api.weatherapi.com/v1";

/**
 * Fetch current weather for a location
 * @param lat - Latitude
 * @param lon - Longitude
 */
export async function getCurrentWeather(
  lat: number,
  lon: number
): Promise<WeatherData> {
  if (!WEATHER_API_KEY) {
    throw new Error("WEATHER_API_KEY not configured");
  }

  const query = `${lat},${lon}`;
  const url = `${WEATHER_API_BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${query}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }

  return (await response.json()) as WeatherData;
}

/**
 * Determine if weather is "sunny" for pricing rules
 */
export function isSunnyWeather(weatherData: WeatherData): boolean {
  const sunnyConditionCodes = [1000, 1003]; // Clear, Partly cloudy
  return (
    sunnyConditionCodes.includes(weatherData.current.condition.code) &&
    weatherData.current.temp_c >= 20 &&
    weatherData.current.precip_mm === 0
  );
}

/**
 * Determine if weather is "rainy" for pricing rules
 */
export function isRainyWeather(weatherData: WeatherData): boolean {
  const rainyConditionCodes = [
    1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246,
  ];
  return (
    rainyConditionCodes.includes(weatherData.current.condition.code) ||
    weatherData.current.precip_mm > 0
  );
}

/**
 * Determine if weather is "windy" for pricing rules
 */
export function isWindyWeather(weatherData: WeatherData): boolean {
  return weatherData.current.wind_kph > 30; // > 30 km/h
}

