// @ts-nocheck

import { getBrowser } from "./browser";
import { USER_AGENTS } from "../proxy/userAgents";
import { ProxyManager } from "../proxy/proxyManager";
import { readFileSync } from "fs";
import { join } from "path";
import { BaseForecastData, TimeSlot } from "../types";

const proxyManager = new ProxyManager();

export async function scraperC(
  url: string,
  region: string
): Promise<BaseForecastData[]> {
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
