// @ts-nocheck

import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { readFileSync } from "fs";
import { join } from "path";
import { USER_AGENTS } from "../proxy/userAgents";
import { ProxyManager } from "../proxy/proxyManager";
import { BaseForecastData } from "../types";

const proxyManager = new ProxyManager();

async function getBrowser() {
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;
  const isFly = process.env.FLY_APP_NAME !== undefined;

  if (!isVercel && !isFly && process.env.NODE_ENV === "development") {
    console.log("Using system Chrome for local development");
    return puppeteerCore.launch({
      headless: true,
      args: ["--no-sandbox"],
      executablePath:
        process.platform === "win32"
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
          : "/usr/bin/google-chrome",
    });
  } else {
    console.log(
      `Using @sparticuz/chromium for ${isVercel ? "Vercel" : isFly ? "Fly.io" : "production"} environment`
    );
    chromium.setGraphicsMode = false;
    return puppeteerCore.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions",
        "--disable-background-networking",
        "--memory-pressure-off",
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless === "new" ? true : chromium.headless,
    });
  }
}

// Convert knots to m/s (Windguru shows wind in knots)
const knotsToMs = (knots: number): number => {
  return Math.round(knots * 0.514444 * 10) / 10;
};

// Parse wind direction from Windguru format (degrees or cardinal)
const parseWindDirection = (value: string | null): number => {
  if (!value) return 0;

  // Check if it's a cardinal direction first
  const upperValue = value.trim().toUpperCase();
  const cardinalMap: { [key: string]: number } = {
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

  if (cardinalMap[upperValue]) {
    return cardinalMap[upperValue];
  }

  // Parse numeric value
  const numericValue = value.replace(/[^\d.]/g, "");
  const degrees = parseFloat(numericValue);

  // CRITICAL: Only accept values that are valid degrees (0-360)
  // Reject timestamps or other large numbers
  if (!isNaN(degrees) && degrees >= 0 && degrees <= 360) {
    return degrees;
  }

  // Invalid value (timestamp, etc.) - return 0 to indicate missing data
  console.warn(
    `[scraperB] Invalid direction value: ${value} (parsed as ${degrees}) - rejecting`
  );
  return 0;
};

// Parse wave direction (similar to wind direction)
const parseWaveDirection = (value: string | null): number => {
  return parseWindDirection(value);
};

export async function scraperB(
  url: string,
  region: string
): Promise<BaseForecastData[]> {
  console.log("\n=== Starting Windguru Scraper ===");
  console.log("Scraping URL:", url);
  console.log("Region:", region);

  // Validate URL - check for placeholder spot IDs
  if (url.includes("SPOT_ID") || !url.match(/windguru\.cz\/\d+/)) {
    const errorMessage = `Windguru spot ID not configured for region "${region}". URL: ${url}`;
    console.error(`[scraperB] ❌ ${errorMessage}`);
    throw new Error(errorMessage);
  }

  let browser = null;
  const proxy = proxyManager.getProxyForRegion(region);
  const startTime = Date.now();

  try {
    browser = await getBrowser();
    console.log("✅ Browser launched");

    const page = await browser.newPage();
    console.log("✅ New page created");

    await page.setUserAgent(
      USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
    );

    // Anti-bot measures
    await page.evaluateOnNewDocument(() => {
      // @ts-ignore
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      // @ts-ignore
      Object.defineProperty(navigator, "plugins", {
        get: () => [
          { name: "Chrome PDF Plugin" },
          { name: "Chrome PDF Viewer" },
          { name: "Native Client" },
        ],
      });
    });

    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (["image", "stylesheet", "font"].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    console.log(`[scraperB] 🌐 Navigating to ${url}...`);
    // Wait for networkidle2 to ensure dynamic content loads
    await page.goto(url, { 
      waitUntil: ["domcontentloaded", "networkidle2"], 
      timeout: 45000 
    });
    console.log(`[scraperB] ✅ Page loaded successfully`);

    // Wait additional time for JavaScript to render the table
    console.log(`[scraperB] ⏳ Waiting for dynamic content to render...`);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check if table is in an iframe
    console.log(`[scraperB] 🔍 Checking for iframes...`);
    const frames = page.frames();
    console.log(`[scraperB] Found ${frames.length} frame(s) on page`);
    
    let targetFrame = page;
    let tableFound = false;

    // First, try to find table in main page
    try {
      const mainTable = await page.$(".tabulka");
      if (mainTable) {
        console.log(`[scraperB] ✅ Found .tabulka in main page`);
        tableFound = true;
      }
    } catch (e) {
      console.log(`[scraperB] ⚠️ .tabulka not in main page, checking iframes...`);
    }

    // If not in main page, check iframes
    if (!tableFound && frames.length > 1) {
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        try {
          const frameTable = await frame.$(".tabulka");
          if (frameTable) {
            console.log(`[scraperB] ✅ Found .tabulka in iframe ${i}`);
            targetFrame = frame;
            tableFound = true;
            break;
          }
        } catch (e) {
          // Continue checking other frames
        }
      }
    }

    console.log(
      `[scraperB] 🔍 Waiting for Windguru table selector (.tabulka)...`
    );
    try {
      await targetFrame.waitForSelector(".tabulka", { timeout: 20000 });
      console.log("✅ Found Windguru table (.tabulka)");
    } catch (selectorError) {
      console.error(
        `[scraperB] ❌ Could not find .tabulka selector, trying alternatives...`
      );
      // Try alternative selectors
      const altSelectors = [
        "table[class*='tabulka']",
        "table.tabulka",
        ".forecast-table",
        "table",
      ];
      let found = false;
      for (const selector of altSelectors) {
        try {
          await targetFrame.waitForSelector(selector, { timeout: 5000 });
          console.log(`[scraperB] ✅ Found table with selector: ${selector}`);
          found = true;
          break;
        } catch (e) {
          console.log(`[scraperB] ⚠️ Selector ${selector} not found`);
        }
      }
      if (!found) {
        // Log page content for debugging
        const pageContent = await targetFrame.content();
        console.error(
          `[scraperB] ❌ Page content (first 2000 chars):`,
          pageContent.substring(0, 2000)
        );
        throw new Error("Could not find Windguru forecast table on page");
      }
    }

    console.log(`[scraperB] ⏳ Waiting 2 seconds for table data to populate...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(`[scraperB] 🔍 Extracting forecast data from page...`);
    // Load evaluation code from separate JS file to avoid TypeScript helper injection
    // @ts-ignore - __dirname is available in CommonJS
    const evalCodePath = join(__dirname, "windguru-eval.js");
    const evalCode = readFileSync(evalCodePath, "utf-8");

    // Use targetFrame.evaluate to extract data from the correct frame (main page or iframe)
    // This avoids TypeScript compilation entirely
    const forecastData = await targetFrame.evaluate(`
      ${evalCode}
      extractWindguruData();
    `);

    if (
      !forecastData ||
      !Array.isArray(forecastData) ||
      forecastData.length === 0
    ) {
      console.error(`[scraperB] ❌ No forecast data extracted from page`);
      throw new Error(
        "Failed to parse Windguru table or no morning forecast found"
      );
    }

    console.log(
      `[scraperB] 🔍 Raw forecast data extracted (${forecastData.length} item(s)):`,
      JSON.stringify(forecastData, null, 2)
    );

    // Convert and parse the data for each date
    const forecasts: BaseForecastData[] = [];

    if (!Array.isArray(forecastData)) {
      throw new Error("Forecast data is not an array");
    }
    for (const data of forecastData) {
      console.log(`[scraperB] 🔄 Processing forecast data:`, {
        raw: data,
        windSpeed: data.windSpeed,
        windDir: data.windDir,
        waveHeight: data.waveHeight,
        wavePeriod: data.wavePeriod,
        waveDir: data.waveDir,
        unixtime: data.unixtime,
      });

      const windSpeedKnots = parseFloat(data.windSpeed) || 0;
      const windSpeedMs = knotsToMs(windSpeedKnots);
      const windDirection = parseWindDirection(data.windDir);
      const swellHeight = parseFloat(data.waveHeight) || 0;
      const swellPeriod = parseInt(data.wavePeriod) || 0;
      const swellDirection = parseWaveDirection(data.waveDir);

      console.log(`[scraperB] 📊 Parsed values:`, {
        windSpeedKnots,
        windSpeedMs,
        windDirection,
        swellHeight,
        swellPeriod,
        swellDirection,
      });

      // Windguru provides unixtime in local time, so we need to adjust to UTC
      // The unixtime is for the start of the day (00:00 local time)
      // We want to store it as UTC 00:00 for that day.
      // So, we create a Date object from the unixtime, which will be in local time.
      // Then we get its UTC components and create a new Date object representing
      // the start of that day in UTC.
      let forecastDate: Date;
      if (data.unixtime) {
        const localDate = new Date(data.unixtime * 1000);
        forecastDate = new Date(
          Date.UTC(
            localDate.getFullYear(),
            localDate.getMonth(),
            localDate.getDate()
          )
        );
        // Normalize to UTC midnight for DB consistency
        forecastDate.setUTCHours(0, 0, 0, 0);
      } else {
        // Fallback if unixtime is missing or invalid
        console.warn(
          `[scraperB] ⚠️ Missing or invalid unixtime for forecast data:`,
          data
        );
        // Use current date as a fallback, normalized to UTC midnight
        const now = new Date();
        forecastDate = new Date(
          Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
        );
      }

      const forecast: BaseForecastData = {
        date: forecastDate.toISOString().split("T")[0], // YYYY-MM-DD
        windSpeed: windSpeedMs,
        windDirection: windDirection,
        swellHeight: swellHeight,
        swellPeriod: swellPeriod,
        swellDirection: swellDirection,
      };
      forecasts.push(forecast);
    }

    console.log(
      `[scraperB] ✅ Successfully scraped ${forecasts.length} forecast(s):`,
      JSON.stringify(forecasts, null, 2)
    );
    return forecasts;
  } catch (error) {
    console.error("\n❌ Windguru scraping failed:", {
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
