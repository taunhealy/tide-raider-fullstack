// @ts-nocheck

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
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Use /tmp instead of /dev/shm
        "--disable-gpu", // Disable GPU acceleration
        "--disable-software-rasterizer", // Disable software rasterizer
        "--disable-extensions", // Disable extensions
        "--disable-background-networking", // Disable background networking
        "--disable-background-timer-throttling", // Disable background timer throttling
        "--disable-renderer-backgrounding", // Disable renderer backgrounding
        "--disable-backgrounding-occluded-windows", // Disable backgrounding occluded windows
        "--disable-ipc-flooding-protection", // Disable IPC flooding protection
        "--memory-pressure-off", // Turn off memory pressure
      ],
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
    
    // Modernize wait selector to handle CSS modules and potential layout shifts
    try {
      await page.waitForSelector('[class*="forecast-day"], [class*="weathertable"], [class*="day-forecast"], [class*="_day_"]', { timeout: 15000 });
      console.log("✅ Found forecast container via CSS module pattern");
    } catch (e) {
      // Fallback: wait for header containing day text
      console.log("⚠️ Could not find specific container, waiting for generic day text...");
      await page.waitForFunction(() => {
        return Array.from(document.querySelectorAll('h3, h4, div')).some(el => /^[A-Za-z]+, [A-Za-z]+ \d+/.test(el.textContent.trim()));
      }, { timeout: 10000 });
    }

    // Auto-scroll to ensure all lazy-loaded content appears
    await page.evaluate(async function () {
      await new Promise<void>(function (resolve) {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(function () {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight || totalHeight > 5000) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Wait slightly for table to stabilize
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Advanced extraction logic for new grid-based structure
    // We use a string to prevent tsx/esbuild from injecting __name or other closures
    const extractionScript = `
      (function() {
        const allDivs = Array.from(document.querySelectorAll('h1, h2, h3, h4, div, span'));
        const dayHeaders = allDivs.filter(function(el) { 
          const text = el.textContent.trim();
          // Support "Monday, Mar 24" OR "Today, Mar 24" OR "Tomorrow, Mar 25"
          return /^(?:Today|Tomorrow|[A-Za-z]+), [A-Za-z]+ \\d+/.test(text) && el.children.length === 0; 
        });
        
        console.log("[Browser] Found " + dayHeaders.length + " potential day headers");

        return dayHeaders.map(function(header) {
          const dateText = header.textContent.trim();
          let block = header.parentElement;
          while (block && block.querySelectorAll('div').length < 15 && block !== document.body) {
            block = block.parentElement;
          }

          if (!block) return { dateText: dateText, rows: [] };

          const timeElements = Array.from(block.querySelectorAll('div, span'))
            .filter(function(el) { 
              const text = el.textContent.trim();
              return /^\\d{2}h$/.test(text) && el.children.length === 0; 
            });
            
          console.log("[Browser] Day " + dateText + ": Found " + timeElements.length + " time elements");

          const rows = timeElements.map(function(timeEl) {
            const time = timeEl.textContent.trim();
            const timeRect = timeEl.getBoundingClientRect();
            const centerX = timeRect.left + timeRect.width / 2;
            
            const cells = Array.from(block.querySelectorAll('div, span, a'))
              .filter(function(cell) {
                if (cell === timeEl || cell.children.length > 2) return false;
                const cellRect = cell.getBoundingClientRect();
                const cellCenterX = cellRect.left + cellRect.width / 2;
                return Math.abs(cellCenterX - centerX) < 25;
              });

            const findByUnit = function(unit) {
               const found = cells.find(function(c) { 
                  const t = c.textContent.trim();
                  return t.endsWith(unit) && !isNaN(parseFloat(t));
               });
               return found ? found.textContent.trim() : "";
            };

            const windSpeed = findByUnit("kts") || findByUnit("kt") || "";
            const waveHeight = findByUnit("m") || "";
            const wavePeriod = findByUnit("s") || "";
            
            const arrowCell = cells.find(function(c) {
               return c.querySelector('[class*="directionarrow"], [title*="°"]');
            }) || cells.find(function(c) {
               const title = c.getAttribute('title') || "";
               return title.includes("°");
            });
            
            const direction = arrowCell ? (arrowCell.getAttribute('title') || arrowCell.querySelector('[title*="°"]')?.getAttribute('title') || "") : "";

            return {
              time: time,
              windSpeed: windSpeed.replace(/[^\\d.]/g, ""),
              windDir: direction,
              waveHeight: waveHeight.replace(/[^\\d.]/g, ""),
              wavePeriod: wavePeriod.replace(/[^\\d.]/g, ""),
              swellDir: direction
            };
          });

          return {
            dateText: dateText,
            rows: rows
          };
        });
      })()
    `;

    const forecastDaysData = await page.evaluate(extractionScript) as any[];

    if (!forecastDaysData || forecastDaysData.length === 0 || forecastDaysData.every(d => d.rows.length === 0)) {
       console.error("❌ Failed to parse forecast days or rows.");
       throw new Error("No forecast data could be extracted from the grid.");
    }

    if (!forecastDaysData || forecastDaysData.length === 0) {
      throw new Error("Failed to parse forecast days from grid structure");
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
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        // Split by comma or space
        const parts = dateText.split(/[, ]+/).filter(Boolean);
        // Format can be "Monday, Mar 30" or "Monday Mar 30" or just "Mar 30"
        let monthName = "";
        let dayStr = "";
        
        for (let i = 0; i < parts.length; i++) {
           if (monthNames.includes(parts[i])) {
              monthName = parts[i];
              dayStr = parts[i+1];
              break;
           }
        }

        const day = parseInt(dayStr);
        const monthIndex = monthNames.indexOf(monthName);
        
        if (monthIndex !== -1 && !isNaN(day)) {
          let year = currentYear;
          if ((currentMonth === 10 || currentMonth === 11) && monthIndex <= 1) {
            year = currentYear + 1;
          }
          let parsedDate = new Date(year, monthIndex, day);
          if (Math.floor((parsedDate.getTime() - now.getTime()) / 86400000) < -1) {
             parsedDate = new Date(currentYear + 1, monthIndex, day);
          }
          return parsedDate;
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
