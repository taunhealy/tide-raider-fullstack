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
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless === "new" ? true : chromium.headless,
      ignoreHTTPSErrors: true,
    });
  }
}

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
    const page = await browser.newPage();

    // Capture console messages from the page for debugging
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("[scraperC]")) {
        console.log(`[scraperC] [browser] ${text}`);
      }
    });

    // Set random user agent
    const userAgent =
      USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    await page.setUserAgent(userAgent);

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`[scraperC] 🔍 Navigating to ${url}...`);
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    console.log(`[scraperC] ✅ Page loaded successfully`);

    // Wait for the forecast widget table to load
    console.log(`[scraperC] 🔍 Waiting for Windy forecast table...`);
    await page.waitForSelector("tr.windywidgetwindSpeed, tr.id-wind-speed", {
      timeout: 30000,
    });

    console.log(`[scraperC] ✅ Found Windy forecast table`);

    // Wait for the days row with id to be present and have multiple cells
    console.log(`[scraperC] 🔍 Waiting for days row to load...`);
    await page.waitForFunction(
      `() => {
        const daysRow = document.querySelector("tr#windyWidgetDays");
        if (!daysRow) return false;
        const cells = daysRow.querySelectorAll("td, th");
        return cells.length > 5; // Should have at least 5 cells (days)
      }`,
      { timeout: 30000 }
    );

    console.log(`[scraperC] ✅ Found days row with multiple cells`);

    // Wait a bit for all data to load
    console.log(`[scraperC] ⏳ Waiting 2 seconds for table to fully load...`);
    await page.waitForTimeout(2000);

    console.log(`[scraperC] 🔍 Extracting forecast data from page...`);

    // Load evaluation code from separate JS file to avoid TypeScript helper injection
    // @ts-ignore - __dirname is available in CommonJS
    const evalCodePath = join(__dirname, "windy-eval.js");
    const evalCode = readFileSync(evalCodePath, "utf-8");

    // Use page.evaluate with the entire function code as a string
    // This avoids TypeScript compilation entirely
    const forecastData = await page.evaluate(`
      ${evalCode}
      extractWindyData();
    `);

    // Check if we got an error object with debug info
    if (
      forecastData &&
      typeof forecastData === "object" &&
      "error" in forecastData
    ) {
      console.error(`[scraperC] ❌ No forecast data extracted from page`);
      console.error(
        `[scraperC] 🔍 Debug info:`,
        JSON.stringify(forecastData.debug, null, 2)
      );
      throw new Error(
        `Failed to parse Windy.app table: ${forecastData.error}. Debug: ${JSON.stringify(forecastData.debug)}`
      );
    }

    if (
      !forecastData ||
      (Array.isArray(forecastData) && forecastData.length === 0)
    ) {
      console.error(`[scraperC] ❌ No forecast data extracted from page`);
      console.error(`[scraperC] 🔍 Received:`, forecastData);
      throw new Error(
        "Failed to parse Windy.app table or no morning forecast found"
      );
    }

    console.log(
      `[scraperC] 🔍 Raw forecast data extracted (${forecastData.length} item(s)):`,
      JSON.stringify(forecastData, null, 2)
    );

    // Convert and parse the data for each date
    const forecasts: BaseForecastData[] = [];

    for (const data of forecastData) {
      console.log(`[scraperC] 🔄 Processing forecast data:`, {
        raw: data,
        windSpeed: data.windSpeed,
        windDirection: data.windDirection,
        swellHeight: data.swellHeight,
        swellPeriod: data.swellPeriod,
        swellDirection: data.swellDirection,
      });

      const windSpeedMs = msToMs(data.windSpeed || 0);
      const windDirection = parseWindDirection(data.windDirection || 0);
      const swellHeight = parseFloat(data.swellHeight) || 0;
      const swellPeriod = parseInt(data.swellPeriod) || 0;
      const swellDirection = parseWindDirection(data.swellDirection || 0);

      console.log(`[scraperC] 📊 Parsed values:`, {
        windSpeedMs,
        windDirection,
        swellHeight,
        swellPeriod,
        swellDirection,
      });

      // Use the date from the data (should be an ISO string)
      const forecastDate = new Date(data.date);
      if (isNaN(forecastDate.getTime())) {
        console.error(`[scraperC] ❌ Invalid date: ${data.date}`);
        throw new Error(`Invalid date received from scraper: ${data.date}`);
      }
      forecastDate.setUTCHours(0, 0, 0, 0);

      const forecast: BaseForecastData = {
        date: forecastDate,
        regionId: region,
        windSpeed: windSpeedMs,
        windDirection: windDirection,
        swellHeight: swellHeight,
        swellPeriod: swellPeriod,
        swellDirection: swellDirection,
      };

      console.log(`[scraperC] ✅ Created forecast object:`, forecast);
      forecasts.push(forecast);
    }

    console.log(
      `[scraperC] ✅ Successfully scraped ${forecasts.length} forecast(s):`,
      JSON.stringify(forecasts, null, 2)
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
