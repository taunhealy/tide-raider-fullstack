import axios from "axios";
import * as fs from "fs";
import * as path from "path";

export enum TimeSlot {
  MORNING = "MORNING",
  NOON = "NOON",
  EVENING = "EVENING"
}

function base64EncodeUrl(str: string): string {
  return Buffer.from(str).toString("base64").replace(/=+$/, "");
}

export async function scrapeWindyJSON(url: string, region: string) {
  console.log(`[scrapeWindyJSON] Analyzing URL: ${url}`);
  
  // Extract latitude and longitude from URL
  const coordMatch = url.match(/\/(\-?\d+\.\d+)\/(\-?\d+\.\d+)/);
  if (!coordMatch) {
    throw new Error(`Could not extract latitude and longitude from Windy URL: ${url}`);
  }
  
  const lat = parseFloat(coordMatch[1]);
  const lon = parseFloat(coordMatch[2]);
  console.log(`[scrapeWindyJSON] Extracted Coords: lat=${lat}, lon=${lon}`);
  
  // Format today's date in YYYY-MM-DDT00:00:00Z format
  const today = new Date().toISOString().split("T")[0];
  const refTime = `${today}T00:00:00Z`;
  
  // Base64 encode the path segments
  const part1 = "forecast";
  const part2 = "ecmwfWaves";
  const part3 = `point/ecmwfWaves/v2.9/${lat}/${lon}?refTime=${refTime}&source=detail&step=3`;
  
  const encPart1 = base64EncodeUrl(part1);
  const encPart2 = base64EncodeUrl(part2);
  const encPart3 = base64EncodeUrl(part3);
  
  const apiUrl = `https://node.windy.com/${encPart1}/${encPart2}/${encPart3}`;
  console.log(`[scrapeWindyJSON] Querying API: ${apiUrl}`);
  
  const response = await axios.get(apiUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Origin": "https://www.windy.com",
      "Referer": "https://www.windy.com/"
    },
    timeout: 30000
  });

  if (response.status !== 200) {
    throw new Error(`Windy API returned status code ${response.status}`);
  }

  // Response is a base64 encoded JSON string
  const base64Data = response.data;
  const decodedStr = Buffer.from(base64Data, "base64").toString("utf-8");
  const payload = JSON.parse(decodedStr);

  const data = payload.data;
  if (!data || !data.hour || !Array.isArray(data.hour)) {
    throw new Error("Invalid forecast data structure returned from Windy API");
  }

  console.log(`[scrapeWindyJSON] Extracted ${data.hour.length} hourly records from API`);

  const forecasts: any[] = [];
  
  for (let i = 0; i < data.hour.length; i++) {
    const hour = data.hour[i];
    const dateStr = data.day[i];
    
    let slot: TimeSlot | null = null;
    
    if (hour >= 5 && hour <= 9) {
      slot = TimeSlot.MORNING;
    } else if (hour >= 11 && hour <= 15) {
      slot = TimeSlot.NOON;
    } else if (hour >= 17 && hour <= 21) {
      slot = TimeSlot.EVENING;
    }

    if (!slot) continue;

    // Parse date (YYYY-MM-DD)
    const [year, month, dateDay] = dateStr.split("-").map(Number);
    const forecastDate = new Date(Date.UTC(year, month - 1, dateDay, 0, 0, 0, 0));

    const existingIdx = forecasts.findIndex(f => 
      f.date.getTime() === forecastDate.getTime() && 
      f.timeSlot === slot
    );

    const preferredHours: Record<TimeSlot, number> = {
      [TimeSlot.MORNING]: 8,
      [TimeSlot.NOON]: 13,
      [TimeSlot.EVENING]: 19,
    };
    const target = preferredHours[slot];

    if (existingIdx !== -1) {
      const existingForecast = forecasts[existingIdx];
      const existingHour = existingForecast.rawHour || 0;

      if (Math.abs(hour - target) < Math.abs(existingHour - target)) {
        forecasts.splice(existingIdx, 1);
      } else {
        continue;
      }
    }

    // Convert wind speed from m/s to knots
    const windSpeedMs = parseFloat(data.wind[i]) || 0;
    const windSpeedKnots = Math.round(windSpeedMs * 1.94384);

    const forecast = {
      date: forecastDate,
      regionId: region,
      timeSlot: slot,
      windSpeed: windSpeedKnots,
      windDirection: Math.round(data.windDir[i] !== undefined ? data.windDir[i] : 0),
      swellHeight: parseFloat(data.swell[i]) || parseFloat(data.waves[i]) || 0,
      swellPeriod: Math.round(data.swellPeriod[i] || 0),
      swellDirection: Math.round(data.swellDir[i] !== undefined ? data.swellDir[i] : 0),
      swellHeight2: parseFloat(data.swell1[i]) || 0,
      swellPeriod2: Math.round(data.swell1Period[i] || 0),
      swellDirection2: Math.round(data.swell1Dir[i] !== undefined ? data.swell1Dir[i] : 0),
      swellHeight3: parseFloat(data.swell2[i]) || 0,
      swellPeriod3: Math.round(data.swell2Period[i] || 0),
      swellDirection3: Math.round(data.swell2Dir[i] !== undefined ? data.swell2Dir[i] : 0),
      swellEnergy: Math.round(data.wavesPower[i] || 0),
      rawHour: hour
    };

    forecasts.push(forecast);
  }

  return forecasts;
}

async function main() {
  const url = "https://www.windy.com/-34.359/18.497/ecmwfWaves/waves?waves,-34.506,18.520,10";
  try {
    const data = await scrapeWindyJSON(url, "western-cape");
    console.log(`\nSuccessfully scraped ${data.length} Windy forecasts from API!`);
    console.log("Sample forecast:", JSON.stringify(data[0], null, 2));
  } catch (e: any) {
    console.error("Scraper failed:", e.message);
  }
}

main();
