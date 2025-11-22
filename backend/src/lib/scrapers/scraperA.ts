import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { USER_AGENTS } from "../proxy/userAgents";
import { ProxyManager } from "../proxy/proxyManager";
import { createHash } from "crypto";
import { BaseForecastData } from "../types";

// Add at the top of the file
declare global {
  interface Window {
    __mousePos?: { x: number; y: number };
  }
}

const cardinalToDirection: { [key: string]: number } = {
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

// Enhanced fingerprint randomization
const generateFingerprint = () => {
  const noise = Math.random().toString(36).slice(2, 7);
  return createHash("sha256").update(noise).digest("hex").slice(0, 32);
};

// Randomized request intervals (2-45 seconds)
const randomizedDelay = (base: number = 2000, variance: number = 43000) =>
  new Promise((resolve) =>
    setTimeout(resolve, base + Math.random() * variance)
  );

// Enhanced browser configuration
const getBrowserArgs = () => {
  const args = [
    "--no-sandbox",
    "--disable-blink-features=AutomationControlled",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    `--font-render-hinting=${Math.random() > 0.5 ? "medium" : "none"}`,
    `--window-size=${1280 + Math.floor(Math.random() * 200)},${720 + Math.floor(Math.random() * 200)}`,
  ];

  if (Math.random() > 0.8) args.push("--disable-accelerated-2d-canvas");
  return args;
};

const proxyManager = new ProxyManager();

const getBrowserPath = () => {
  return process.env.PLAYWRIGHT_BROWSERS_PATH || "./playwright";
};

async function getBrowser() {
  // Check if running on Vercel (serverless environment) or Fly.io (container environment)
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;
  const isFly = process.env.FLY_APP_NAME !== undefined;
  const isProduction = process.env.NODE_ENV === "production";

  // Use @sparticuz/chromium for production environments (Vercel, Fly.io, etc.)
  // Only use system Chrome in local development
  if (!isVercel && !isFly && process.env.NODE_ENV === "development") {
    // Local development - use Chrome/Chromium installed on the system
    console.log("Using system Chrome for local development");
    return puppeteerCore.launch({
      headless: true,
      args: ["--no-sandbox"],
      // On Windows, you might need to specify the path to Chrome/Chromium
      executablePath:
        process.platform === "win32"
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" // Default Chrome path
          : "/usr/bin/google-chrome", // Default Linux Chrome path
    });
  } else {
    // Production/serverless environment (Vercel, Fly.io, etc.) - use @sparticuz/chromium
    console.log(
      `Using @sparticuz/chromium for ${isVercel ? "Vercel" : isFly ? "Fly.io" : "production"} environment`
    );
    chromium.setGraphicsMode = false; // Disable graphics mode for serverless
    return puppeteerCore.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless === "new" ? true : chromium.headless,
    });
  }
}

export async function scraperA(
  url: string,
  region: string
): Promise<BaseForecastData[]> {
  console.log("\n=== Starting Puppeteer Scraper ===");
  console.log("Scraping URL:", url);
  console.log("Region:", region);

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
      // @ts-ignore - navigator is available in browser context
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      // @ts-ignore - navigator is available in browser context
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

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector(".weathertable", { timeout: 15000 });
    console.log("✅ Found weather table");

    // Wait 4 seconds for table to load
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Extract forecast-day sections with their dates and rows
    // This finds ALL forecast-day containers on the page (today, tomorrow, day after tomorrow, etc.)
    const forecastDaysData = await page.evaluate(() => {
      // @ts-ignore - document is available in browser context
      const doc = document as any;
      // Find all forecast-day containers - each represents a different day
      const forecastDays = Array.from(doc.querySelectorAll(".forecast-day"));

      console.log(
        `[Browser] Found ${forecastDays.length} forecast-day container(s)`
      );

      return forecastDays.map((dayElement: any, index: number) => {
        // Extract date from header - each forecast-day has its own header with the date
        const header = dayElement.querySelector(".weathertable__header");
        const headline = header?.querySelector(".weathertable__headline");
        const dateText = headline?.textContent?.trim() || "";

        // Extract all rows for THIS specific day's container
        // Each forecast-day container has its own set of weathertable__row elements
        const rows = Array.from(
          dayElement.querySelectorAll(".weathertable__row")
        ).map((row: any) => ({
          time: row.querySelector(".data-time .value")?.textContent,
          windSpeed: row.querySelector(".cell-wind-3 .units-ws")?.textContent,
          windDir: row
            .querySelector(".cell-wind-2 .directionarrow")
            ?.getAttribute("title"),
          waveHeight: row.querySelector(".cell-waves-2 .units-wh")?.textContent,
          wavePeriod: row.querySelector(".cell-waves-2 .data-wavefreq")
            ?.textContent,
          swellDir: row
            .querySelector(".cell-waves-1 .directionarrow")
            ?.getAttribute("title"),
        }));

        console.log(
          `[Browser] Day ${index + 1}: "${dateText}" with ${rows.length} time slots`
        );

        return {
          dateText,
          rows,
        };
      });
    });

    if (!forecastDaysData || forecastDaysData.length === 0) {
      throw new Error("Failed to parse forecast days");
    }

    console.log(
      `✅ Found ${forecastDaysData.length} forecast day container(s) on the page`
    );
    console.log(
      `📅 Dates found: ${forecastDaysData.map((d) => d.dateText).join(", ")}`
    );

    // Get current date for year determination
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const forecasts: BaseForecastData[] = [];

    // Helper function to parse date from text like "Monday, Nov 17"
    // Handles dates in current year and next year (for year rollover)
    const parseDateFromText = (dateText: string): Date | null => {
      try {
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const parts = dateText.split(",");
        if (parts.length >= 2) {
          const monthDay = parts[1].trim().split(" ");
          const monthName = monthDay[0];
          const day = parseInt(monthDay[1]);

          const monthIndex = monthNames.indexOf(monthName);
          if (monthIndex !== -1 && !isNaN(day)) {
            // Determine the year - start with current year
            let year = currentYear;

            // If we're in Nov/Dec and see Jan/Feb, it's next year
            if (
              (currentMonth === 10 || currentMonth === 11) &&
              monthIndex <= 1
            ) {
              year = currentYear + 1;
            }

            let parsedDate = new Date(year, monthIndex, day);

            // If the parsed date is in the past (more than 1 day ago), it's probably next year
            // Forecast pages typically only show future dates
            const daysDiff = Math.floor(
              (parsedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysDiff < -1) {
              // Date is in the past, assume it's next year
              parsedDate = new Date(currentYear + 1, monthIndex, day);
            }

            return parsedDate;
          }
        }
      } catch (error) {
        console.error("Error parsing date:", error);
      }
      return null;
    };

    // Process ALL forecast days found on the page
    for (const dayData of forecastDaysData) {
      const parsedDate = parseDateFromText(dayData.dateText);
      if (!parsedDate) {
        console.warn(
          `⚠️ Could not parse date from "${dayData.dateText}", skipping...`
        );
        continue;
      }

      const dateStr = parsedDate.toISOString().split("T")[0];
      console.log(
        `🔍 Processing forecast for ${dayData.dateText} (${dateStr})...`
      );

      // Find morning forecast data (hours 5-11)
      let morningForecast: BaseForecastData | null = null;

      for (const row of dayData.rows) {
        const timeStr = row.time?.toString() || "";
        const hour = parseInt(timeStr.replace("h", ""));

        if (hour >= 5 && hour <= 11) {
          console.log(
            `✅ Found morning forecast data for ${dateStr} at hour ${hour}`
          );
          morningForecast = {
            date: new Date(parsedDate),
            regionId: region,
            windSpeed: parseInt(row.windSpeed || "0"),
            windDirection: parseFloat(row.windDir?.replace("°", "") || "0"),
            swellHeight: parseFloat(row.waveHeight || "0"),
            swellPeriod: parseInt((row.wavePeriod || "0").replace(/\s+s$/, "")),
            swellDirection: parseFloat(row.swellDir?.replace("°", "") || "0"),
          };
          console.log("📊 Forecast data:", morningForecast);
          break; // Use first morning hour found
        }
      }

      if (morningForecast) {
        forecasts.push(morningForecast);
      } else {
        console.warn(
          `⚠️ No morning forecast found between 05h-11h for ${dayData.dateText} (${dateStr})`
        );
      }
    }

    if (forecasts.length === 0) {
      console.error("❌ No morning forecast data found for any day");
      throw new Error("No morning forecast data found between 05h-11h");
    }

    console.log(
      `✅ Successfully scraped ${forecasts.length} forecast(s): ${forecasts.map((f) => f.date.toISOString().split("T")[0]).join(", ")}`
    );
    return forecasts;
  } catch (error) {
    console.error("\n❌ Scraping failed:", {
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
