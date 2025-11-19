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

// Convert knots to m/s (Windguru shows wind in knots)
const knotsToMs = (knots: number): number => {
  return Math.round(knots * 0.514444 * 10) / 10;
};

// Parse wind direction from Windguru format (degrees or cardinal)
const parseWindDirection = (value: string | null): number => {
  if (!value) return 0;

  const numericValue = value.replace(/[^\d.]/g, "");
  const degrees = parseFloat(numericValue);

  if (!isNaN(degrees)) {
    return degrees;
  }

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

  const upperValue = value.trim().toUpperCase();
  return cardinalMap[upperValue] || 0;
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
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    console.log(`[scraperB] ✅ Page loaded successfully`);

    console.log(
      `[scraperB] 🔍 Waiting for Windguru table selector (.tabulka)...`
    );
    try {
      await page.waitForSelector(".tabulka", { timeout: 15000 });
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
          await page.waitForSelector(selector, { timeout: 5000 });
          console.log(`[scraperB] ✅ Found table with selector: ${selector}`);
          found = true;
          break;
        } catch (e) {
          console.log(`[scraperB] ⚠️ Selector ${selector} not found`);
        }
      }
      if (!found) {
        // Log page content for debugging
        const pageContent = await page.content();
        console.error(
          `[scraperB] ❌ Page content (first 2000 chars):`,
          pageContent.substring(0, 2000)
        );
        throw new Error("Could not find Windguru forecast table on page");
      }
    }

    console.log(`[scraperB] ⏳ Waiting 4 seconds for table to fully load...`);
    await page.waitForTimeout(4000);

    console.log(`[scraperB] 🔍 Extracting forecast data from page...`);
    // Load evaluation code from separate JS file to avoid TypeScript helper injection
    // @ts-ignore - __dirname is available in CommonJS
    const evalCodePath = join(__dirname, "windguru-eval.js");
    const evalCode = readFileSync(evalCodePath, "utf-8");

    // Use page.evaluate with the entire function code as a string
    // This avoids TypeScript compilation entirely
    const forecastData = await page.evaluate(`
      ${evalCode}
      extractWindguruData();
    `);

    if (!forecastData || forecastData.length === 0) {
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

      // Create date from unixtime
      const forecastDate = new Date(data.unixtime * 1000);
      forecastDate.setUTCHours(0, 0, 0, 0); // Set to start of day

      const forecast: BaseForecastData = {
        date: forecastDate,
        regionId: region,
        windSpeed: windSpeedMs,
        windDirection: windDirection,
        swellHeight: swellHeight,
        swellPeriod: swellPeriod,
        swellDirection: swellDirection,
      };

      console.log(`[scraperB] ✅ Created forecast object:`, forecast);
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
