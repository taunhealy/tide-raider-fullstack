// @ts-nocheck

import { getBrowser } from "./browser";
import { USER_AGENTS } from "../proxy/userAgents";
import { ProxyManager } from "../proxy/proxyManager";
import { readFileSync } from "fs";
import { join } from "path";
import { BaseForecastData, TimeSlot } from "../types";

const proxyManager = new ProxyManager();

// Convert m/s to m/s (Windy.app already shows in m/s, but we'll keep this for consistency)
const msToMs = (ms: number): number => {
  return Math.round(ms * 10) / 10;
};

// Parse wind direction from rotation degrees (Windy.app uses CSS transform rotate)
const parseWindDirection = (rotationDegrees: number): number => {
  // Windy.app arrows point in the direction the wind/waves are GOING TO (direction of travel)
  // Meteorological convention reports the direction wind/waves are COMING FROM
  // To convert: add 180° (or subtract 180° and handle wrap-around)
  // Example: Arrow pointing NNW (342°) = wind going towards NNW = wind coming FROM SSE (162°)
  let fromDirection = (rotationDegrees + 180) % 360;
  if (fromDirection < 0) fromDirection += 360;
  return Math.round(fromDirection);
};

export async function scraperC(
  url: string,
  region: string
): Promise<BaseForecastData[]> {
  let browser;
  try {
    // Validate URL
    if (!url || url.includes("SPOT_ID") || url.includes("PLACEHOLDER")) {
      throw new Error(
        `Invalid Windy.app URL for region ${region}: ${url}. Please configure a valid spot URL.`
      );
    }

    console.log(`[scraperC] 🌐 Starting Windy.app scrape for ${region}`);
    console.log(`[scraperC] 📍 URL: ${url}`);

    browser = await getBrowser();
    const context = await browser.newContext({
      userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
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

    console.log(`[scraperC] 🔍 Navigating to ${url}...`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    console.log(`[scraperC] ✅ Page loaded successfully`);

    // Wait for the forecast widget table to load
    console.log(`[scraperC] 🔍 Waiting for Windy forecast table...`);
    await page.waitForSelector("#windywidgettable, tr.windywidgetwindSpeed, tr.id-wind-speed, .forecast-table, table", {
      timeout: 60000,
    });

    console.log(`[scraperC] ✅ Found Windy forecast table`);

    // Wait for the table rows to be present and have data
    console.log(`[scraperC] 🔍 Waiting for forecast rows to load...`);
    await page.waitForFunction(
      `() => {
        const table = document.querySelector("#windywidgettable");
        if (!table) return false;
        const rows = table.querySelectorAll("tr");
        return rows.length > 5;
      }`,
      { timeout: 30000 }
    );

    console.log(`[scraperC] ✅ Found days row with multiple cells`);

    // Wait a bit for all data to load
    console.log(`[scraperC] ⏳ Waiting 2 seconds for table to fully load...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(`[scraperC] 🔍 Extracting forecast data from page...`);

    // Load evaluation code from separate JS file
    // @ts-ignore
    const evalCodePath = join(__dirname, "windy-eval.js");
    const evalCode = readFileSync(evalCodePath, "utf-8");

    const forecastData = await page.evaluate(`
      (function() {
        ${evalCode}
        return extractWindyData();
      })()
    `);

    // Check if we got an error object with debug info
    if (
      forecastData &&
      typeof forecastData === "object" &&
      "error" in forecastData
    ) {
      const errorData = forecastData as { error: unknown; debug?: unknown };
      console.error(`[scraperC] ❌ No forecast data extracted from page`);
      console.error(
        `[scraperC] 🔍 Debug info:`,
        JSON.stringify(errorData.debug, null, 2)
      );
      throw new Error(
        `Failed to parse Windy.app table: ${errorData.error}. Debug: ${JSON.stringify(errorData.debug)}`
      );
    }

    if (
      !forecastData ||
      (Array.isArray(forecastData) && forecastData.length === 0)
    ) {
      console.error(`[scraperC] ❌ No forecast data extracted from page`);
      console.error(`[scraperC] 🔍 Received:`, forecastData);
      throw new Error(
        "Failed to parse Windy.app table"
      );
    }

    // Ensure forecastData is an array
    if (!Array.isArray(forecastData)) {
      throw new Error("Forecast data is not an array");
    }

    console.log(
      `[scraperC] 🔍 Raw hourly forecast data extracted (${forecastData.length} items)`
    );

    // Convert and parse the data for each date/slot
    const forecasts: BaseForecastData[] = [];

    for (const data of forecastData) {
      const hour = data.hour;
      let slot: TimeSlot | null = null;
      
      // Map hours to slots (consistent with scraperA)
      if (hour >= 5 && hour <= 9) {
        slot = TimeSlot.MORNING;
      } else if (hour >= 11 && hour <= 15) {
        slot = TimeSlot.NOON;
      } else if (hour >= 17 && hour <= 21) {
        slot = TimeSlot.EVENING;
      }

      if (!slot) continue;

      // Check if we already have a forecast for this date and slot
      // Windy often provides data every 3 hours (0, 3, 6, 9, 12, 15, 18, 21)
      const forecastDate = new Date(data.date);
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

        // If this hour is closer to our target hour for the slot, replace it
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
        windDirection: data.windDirection !== null ? parseWindDirection(data.windDirection) : 0,
        swellHeight: parseFloat(data.swellHeight) || 0,
        swellPeriod: Math.round(data.swellPeriod || 0),
        swellDirection: data.swellDirection !== null ? parseWindDirection(data.swellDirection) : 0,
      };
      (forecast as any).rawHour = hour;

      forecasts.push(forecast);
    }

    console.log(
      `[scraperC] ✅ Successfully categorized into ${forecasts.length} forecast(s) across slots`
    );
    return forecasts;
  } catch (error) {
    console.error("\n❌ Windy.app scraping failed:", {
      url,
      region,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("\n🔚 Browser closed");
    }
  }
}
