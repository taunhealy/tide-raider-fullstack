import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

// Helper function to deserialize Astro's prop format
function parseAstroProp(val: any): any {
  if (val === null || val === undefined) return val;
  
  if (Array.isArray(val)) {
    if (val.length === 2 && typeof val[0] === "number") {
      const [type, data] = val;
      if (type === 0) {
        return parseAstroProp(data);
      }
      if (type === 1) {
        if (Array.isArray(data)) {
          return data.map(item => parseAstroProp(item));
        }
        return parseAstroProp(data);
      }
      if (type === 3) {
        return new Date(data);
      }
      return parseAstroProp(data);
    }
    return val.map(item => parseAstroProp(item));
  }
  
  if (typeof val === "object") {
    const res: any = {};
    for (const key of Object.keys(val)) {
      res[key] = parseAstroProp(val[key]);
    }
    return res;
  }
  
  return val;
}

export async function scrapeWindfinderJSON(url: string, region: string) {
  console.log(`[scrapeWindfinderJSON] Fetching ${url} via Axios...`);
  
  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5"
    },
    timeout: 30000
  });

  const html = response.data;
  const $ = cheerio.load(html);
  
  // Find the astro-island containing fcSectionData
  const island = $("astro-island").filter((_, el) => {
    const props = $(el).attr("props");
    return props ? props.includes("fcSectionData") : false;
  });

  if (island.length === 0) {
    throw new Error("Could not find Astro Island containing fcSectionData in raw HTML");
  }

  const propsStr = island.attr("props") || "";
  const rawProps = JSON.parse(propsStr);
  const parsedProps = parseAstroProp(rawProps);
  
  const fcSectionData = parsedProps.fcSectionData;
  if (!fcSectionData || !Array.isArray(fcSectionData)) {
    throw new Error("fcSectionData is missing or invalid in parsed props");
  }

  // Flatten days
  const rawDays = fcSectionData.flat();
  console.log(`[scrapeWindfinderJSON] Extracted ${rawDays.length} raw days from JSON`);

  const forecasts: any[] = [];
  
  const tidePhaseMap: Record<string, string> = {
    down: "Falling",
    up: "Rising",
    high: "High",
    low: "Low"
  };

  for (const day of rawDays) {
    if (!day.dtl || !day.horizons || !Array.isArray(day.horizons)) continue;

    // Parse day date (e.g. "2026-05-24T00:00:00+02:00")
    const localDateStr = day.dtl.split("T")[0];
    const [year, month, dateDay] = localDateStr.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, dateDay, 0, 0, 0, 0));

    for (const h of day.horizons) {
      if (!h.fcData || !h.fcData.dtl) continue;

      // Extract local time hour (e.g., 2026-05-24T08:00:00+02:00 -> 8)
      const hourStr = h.fcData.dtl.split("T")[1].substring(0, 2);
      const hour = parseInt(hourStr);
      if (isNaN(hour)) continue;

      let slot: "MORNING" | "NOON" | "EVENING" | null = null;
      
      // Map hours to slots (now with more flexibility for Superforecast)
      if ([5, 6, 7, 8, 9].includes(hour)) {
        slot = "MORNING";
      } else if ([11, 12, 13, 14, 15].includes(hour)) {
        slot = "NOON";
      } else if ([17, 18, 19, 20, 21].includes(hour)) {
        slot = "EVENING";
      }

      if (slot) {
        const existingIdx = forecasts.findIndex(f => f.date.getTime() === parsedDate.getTime() && f.timeSlot === slot);
        
        const preferredHours = { MORNING: 8, NOON: 13, EVENING: 19 };
        const target = preferredHours[slot];
        
        const currentHasTide = h.hasTideData && h.tideData;
        
        if (existingIdx !== -1) {
          const existingForecast = forecasts[existingIdx];
          const existingHasTide = !!existingForecast.tide;
          const existingHour = existingForecast.rawHour || 0;
          
          let shouldReplace = false;
          if (currentHasTide && !existingHasTide) {
            shouldReplace = true;
          } else if (currentHasTide === existingHasTide) {
            if (Math.abs(hour - target) < Math.abs(existingHour - target)) {
              shouldReplace = true;
            }
          }

          if (shouldReplace) {
            forecasts.splice(existingIdx, 1);
          } else {
            continue;
          }
        }

        // Convert wind speed from m/s to knots
        const wsMs = parseFloat(h.fcData.ws || "0") || 0;
        const windSpeedKnots = Math.round(wsMs * 1.94384);

        // Map tide string
        let tideValue = "";
        if (currentHasTide) {
          const tidePhase = tidePhaseMap[h.tideData.tp] || h.tideData.tp;
          const heightStr = h.tideData.th !== undefined && h.tideData.th !== null ? `${h.tideData.th.toFixed(1)}m` : "";
          tideValue = tidePhase && heightStr ? `${tidePhase} (${heightStr})` : (tidePhase || heightStr);
        }

        const forecast = {
          date: parsedDate,
          regionId: region,
          timeSlot: slot,
          windSpeed: windSpeedKnots,
          windDirection: Math.round(h.fcData.wd !== undefined ? h.fcData.wd : -1),
          swellHeight: parseFloat(h.fcData.wah || "0") || 0,
          swellPeriod: Math.round(parseFloat(h.fcData.wap || "0") || 0),
          swellDirection: Math.round(h.fcData.wad !== undefined ? h.fcData.wad : -1),
          tide: tideValue,
          rawHour: hour
        };

        forecasts.push(forecast);
      }
    }
  }

  return forecasts;
}

async function main() {
  const superUrl = "https://www.windfinder.com/weatherforecast/muizenberg";
  const regularUrl = "https://www.windfinder.com/forecast/muizenberg";
  
  try {
    console.log("=== Testing Superforecast URL ===");
    const superData = await scrapeWindfinderJSON(superUrl, "western-cape");
    console.log(`Successfully scraped ${superData.length} forecasts from Superforecast JSON!`);
    console.log("Sample Superforecast:", JSON.stringify(superData[0], null, 2));

    console.log("\n=== Testing Regular Forecast URL ===");
    const regularData = await scrapeWindfinderJSON(regularUrl, "western-cape");
    console.log(`Successfully scraped ${regularData.length} forecasts from Regular Forecast JSON!`);
    console.log("Sample Regular Forecast:", JSON.stringify(regularData[0], null, 2));
  } catch (e: any) {
    console.error("Scraper failed:", e.message);
  }
}

if (require.main === module) {
  main();
}
