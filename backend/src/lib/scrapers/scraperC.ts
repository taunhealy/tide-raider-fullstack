// @ts-nocheck

import { getBrowser } from "./browser";
import { USER_AGENTS } from "../proxy/userAgents";
import { ProxyManager } from "../proxy/proxyManager";
import { readFileSync } from "fs";
import { join } from "path";
import { BaseForecastData, TimeSlot } from "../types";
import axios from "axios";

const proxyManager = new ProxyManager();

function base64EncodeUrl(str: string): string {
  return Buffer.from(str).toString("base64").replace(/=+$/, "");
}

export async function scraperC(
  url: string,
  region: string
): Promise<BaseForecastData[]> {
  // Validate URL
  if (!url || url.includes("SPOT_ID") || url.includes("PLACEHOLDER")) {
    throw new Error(
      `Invalid Windy URL for region ${region}: ${url}. Please configure a valid spot URL.`
    );
  }

  console.log(`[scraperC] 🌐 Starting Windy.com scrape for ${region}`);
  console.log(`[scraperC] 📍 URL: ${url}`);

  // Try direct keyless API fetch first (instant & robust)
  try {
    console.log(`[scraperC] 🚀 Attempting direct JSON API extraction...`);
    
    // Extract latitude and longitude from URL
    const coordMatch = url.match(/\/(\-?\d+\.\d+)\/(\-?\d+\.\d+)/);
    if (!coordMatch) {
      throw new Error(`Could not extract latitude and longitude from Windy URL: ${url}`);
    }
    
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    
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
    console.log(`[scraperC] Querying endpoint: ${apiUrl}`);
    
    const response = await axios.get(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://www.windy.com",
        "Referer": "https://www.windy.com/"
      },
      timeout: 30000
    });

    if (response.status === 200) {
      // Decode base64
      const base64Data = response.data;
      const decodedStr = Buffer.from(base64Data, "base64").toString("utf-8");
      const payload = JSON.parse(decodedStr);
      const data = payload.data;
      
      if (data && data.hour && Array.isArray(data.hour)) {
        console.log(`[scraperC] ✅ Extracted ${data.hour.length} hourly records from API`);
        const forecasts: BaseForecastData[] = [];
        
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
            const existingForecast = forecasts[existingIdx] as any;
            const existingHour = existingForecast.rawHour || 0;

            if (Math.abs(hour - target) < Math.abs(existingHour - target)) {
              forecasts.splice(existingIdx, 1);
            } else {
              continue;
            }
          }

          const windSpeedMs = parseFloat(data.wind[i]) || 0;
          const windSpeedKnots = Math.round(windSpeedMs * 1.94384);

          const forecast: BaseForecastData = {
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
          };
          (forecast as any).rawHour = hour;

          forecasts.push(forecast);
        }

        if (forecasts.length > 0) {
          console.log(`[scraperC] 🎯 Direct JSON extraction SUCCESSFUL! Scraped ${forecasts.length} forecast(s)`);
          return forecasts;
        }
      }
    }
  } catch (apiErr: any) {
    console.warn(`[scraperC] ⚠️ Direct JSON extraction failed: ${apiErr.message}. Falling back to browser...`);
  }

  // === Puppeteer Fallback ===
  let browser;
  try {
    // Validate URL
    if (!url || url.includes("SPOT_ID") || url.includes("PLACEHOLDER")) {
      throw new Error(
        `Invalid Windy URL for region ${region}: ${url}. Please configure a valid spot URL.`
      );
    }

    console.log(`[scraperC] 🌐 Starting Windy.com scrape for ${region}`);
    console.log(`[scraperC] 📍 URL: ${url}`);

    browser = await getBrowser();
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const context = await browser.newContext({
      userAgent,
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Capture console messages from the page for debugging
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("[scraperC]")) {
        console.log(`[scraperC] [browser] ${text}`);
      }
    });

    // TACTICAL: Append ',d:waves' if missing to force open the forecast detail pane
    // Using /ecmwfWaves/waves in the path is more robust than just the param
    let tacticalUrl = url;
    if (!tacticalUrl.includes('ecmwfWaves')) {
      tacticalUrl = tacticalUrl.replace('/waves', '/ecmwfWaves/waves');
    }
    if (!tacticalUrl.includes(',d:')) {
      tacticalUrl = tacticalUrl.includes('?') ? `${tacticalUrl},d:waves` : `${tacticalUrl}?waves,d:waves`;
    }

    console.log(`[scraperC] 🔍 Navigating to ${tacticalUrl}...`);
    await page.goto(tacticalUrl, {
      waitUntil: "load", 
      timeout: 120000,
    });

    console.log(`[scraperC] ✅ Navigation committed.`);

    // TACTICAL: Force clear overlays and wait for table
    try {
      console.log(`[scraperC] 🛡️ Neutralizing obstructions...`);
      
      // 1. Wait for initial load
      await new Promise(r => setTimeout(r, 10000));
      
      // 2. Dismiss cookie banner if present
      const cookieButtons = await page.$$('.ok-button, .btn-ok, #consent-layer button, .consent-banner button');
      if (cookieButtons.length > 0) {
        console.log(`[scraperC] 🍪 Dismissing cookie banner...`);
        await cookieButtons[0].click();
        await new Promise(r => setTimeout(r, 2000));
      }

      // 3. Clear search overlay / Focus map
      console.log(`[scraperC] 🗺️ Focusing map...`);
      await page.mouse.click(500, 300);
      await page.keyboard.press('Escape');

      // 4. Try to open the forecast pane if not visible
      const tableVisible = await page.isVisible('.main-table__data-table');
      if (!tableVisible) {
        console.log(`[scraperC] 📋 Table not visible. Attempting to open...`);
        await page.keyboard.press('o');
        await new Promise(r => setTimeout(r, 3000));
        
        // Try clicking "Waves & Tides" button if still not visible
        const wavesBtn = await page.getByText('Waves & Tides', { exact: false });
        if (await wavesBtn.count() > 0) {
           console.log(`[scraperC] 🌊 Clicking Waves & Tides button...`);
           await wavesBtn.first().click();
           await new Promise(r => setTimeout(r, 3000));
        }
      }

    } catch (e) {
      console.log(`[scraperC] ⚠️ Obstruction neutralization failed: ${e.message}`);
    }

    // Wait for the forecast table to load
    console.log(`[scraperC] 🔍 Waiting for Windy forecast table...`);
    try {
      await page.waitForSelector(".main-table__data-table", {
        timeout: 60000,
        state: 'visible'
      });
    } catch (e) {
      console.log(`[scraperC] ❌ Table not found. Capturing visual intel...`);
      await page.screenshot({ path: join(process.cwd(), 'windy-failure.png'), fullPage: true });
      throw new Error(`Windy table not found after navigation and interaction. Check windy-failure.png for clues.`);
    }

    console.log(`[scraperC] ✅ Found Windy forecast table`);

    // Wait for data populate
    console.log(`[scraperC] ⏳ Synchronizing tactical data...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log(`[scraperC] 🔍 Extracting forecast data from page...`);
    // Load evaluation code from separate JS file
    // @ts-ignore
    const evalCodePath = join(__dirname, "windy-com-eval.js");
    const evalCode = readFileSync(evalCodePath, "utf-8");

    const forecastData = await page.evaluate(`
      (function() {
        ${evalCode}
        return extractWindyComData();
      })()
    `);

    if (
      forecastData &&
      typeof forecastData === "object" &&
      "error" in forecastData
    ) {
      throw new Error(`Failed to parse Windy.com table: ${forecastData.error}`);
    }

    if (!forecastData || !Array.isArray(forecastData) || forecastData.length === 0) {
      throw new Error("Failed to parse Windy.com table or no data found");
    }

    console.log(`[scraperC] 🔍 Raw hourly forecast data extracted (${forecastData.length} items)`);

    const forecasts: BaseForecastData[] = [];
    const now = new Date();

    for (const data of forecastData) {
      const hour = data.hour;
      let slot: TimeSlot | null = null;
      
      if (hour >= 5 && hour <= 9) {
        slot = TimeSlot.MORNING;
      } else if (hour >= 11 && hour <= 15) {
        slot = TimeSlot.NOON;
      } else if (hour >= 17 && hour <= 21) {
        slot = TimeSlot.EVENING;
      }

      if (!slot) continue;

      // Parse date from Windy's day text (e.g. "Monday 10")
      let forecastDate = new Date();
      if (data.day && data.day !== "Today") {
          const dayMatch = data.day.match(/(\w+)\s+(\d+)/);
          if (dayMatch) {
              const dayOfMonth = parseInt(dayMatch[2]);
              forecastDate.setUTCDate(dayOfMonth);
              // Handle month wrap-around if needed
              if (dayOfMonth < now.getDate()) {
                  forecastDate.setUTCMonth(forecastDate.getUTCMonth() + 1);
              }
          }
      }
      forecastDate.setUTCHours(0, 0, 0, 0);
      
      const existingIdx = forecasts.findIndex(f => 
        f.date.getTime() === forecastDate.getTime() && 
        f.timeSlot === slot
      );

      if (existingIdx !== -1) {
        const preferredHours: Record<TimeSlot, number> = {
          [TimeSlot.MORNING]: 8,
          [TimeSlot.NOON]: 13,
          [TimeSlot.EVENING]: 19,
        };
        const target = preferredHours[slot];
        const existingForecast = forecasts[existingIdx] as any;
        const existingHour = existingForecast.rawHour || 0;

        if (Math.abs(hour - target) < Math.abs(existingHour - target)) {
          forecasts.splice(existingIdx, 1);
        } else {
          continue;
        }
      }

      const forecast: BaseForecastData = {
        date: forecastDate,
        regionId: region,
        timeSlot: slot,
        windSpeed: Math.round(data.windSpeed || 0),
        windDirection: data.windDirection || 0,
        swellHeight: parseFloat(data.swellHeight) || parseFloat(data.waveHeight) || 0,
        swellPeriod: Math.round(data.swellPeriod || 0),
        swellDirection: data.swellDirection || 0,
        swellHeight2: parseFloat(data.swellHeight2) || 0,
        swellPeriod2: Math.round(data.swellPeriod2 || 0),
        swellDirection2: data.swellDirection2 || 0,
        swellHeight3: parseFloat(data.swellHeight3) || 0,
        swellPeriod3: Math.round(data.swellPeriod3 || 0),
        swellDirection3: data.swellDirection3 || 0,
        swellEnergy: Math.round(data.swellEnergy || 0),
      };
      (forecast as any).rawHour = hour;

      forecasts.push(forecast);
    }

    console.log(`[scraperC] ✅ Successfully categorized into ${forecasts.length} forecast(s) across slots`);
    return forecasts;
  } catch (error) {
    console.error("\n❌ Windy.com scraping failed:", {
      url,
      region,
      error: (error as Error).message,
    });
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
