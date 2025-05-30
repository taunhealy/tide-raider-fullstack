import { NextResponse } from "next/server";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const CACHE_DURATION = 1800000; // 30 minutes in milliseconds

if (!OPENWEATHER_API_KEY) {
  console.error("❌ Weather API: Missing API key");
  throw new Error("Weather API key not configured");
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();

function formatLocation(location: string) {
  // Remove any special characters and extra spaces
  const cleanLocation = location.trim().replace(/[^\w\s,]/g, "");

  // Split into parts (e.g., "Befasy, Madagascar" -> ["Befasy", "Madagascar"])
  const parts = cleanLocation.split(",").map((part) => part.trim());

  // If we have both city and country, format as "city,country"
  // If we only have one part, use it as is
  return parts.length > 1 ? `${parts[0]},${parts[parts.length - 1]}` : parts[0];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    return NextResponse.json({
      temp: Math.round(weatherData.main.temp),
      condition: weatherData.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`,
      location: weatherData.name,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("❌ Weather API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
