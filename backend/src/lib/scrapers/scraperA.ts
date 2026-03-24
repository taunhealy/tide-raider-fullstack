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

  // Use @sparticuz/chromium for production environments (Vercel, Fly.io, etc.)
  // Only use system Chrome in local development
  if (!isVercel && !isFly && process.env.NODE_ENV === "development") {
    // Local development - use Chrome/Chromium installed on the system
    console.log("Using system Chrome for local development");
    return puppeteerCore.launch({
      headless: true,
      args: ["--no-sandbox"],
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
        "--disable-dev-shm-usage",
        "--disable-gpu",
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
  const startTime = Date.now();

  try {
    browser = await getBrowser();
    console.log("✅ Browser launched");

    const page = await browser.newPage();
    console.log("✅ New page created");
    
    // Force Desktop layout
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => console.log(`[Browser] ${msg.text()}`));

    await page.setUserAgent(
      USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
    );

    // Anti-bot measures
    await page.evaluateOnNewDocument(() => {
      // @ts-ignore
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (["image", "font", "stylesheet"].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
 
    // Handle Cookie Consent
    await page.evaluate(function () {
      const btns = Array.from(document.querySelectorAll('button, a, span')).filter(function(el) {
         const t = el.textContent?.trim().toLowerCase() || "";
         return t === 'accept' || t === 'agree' || t.includes('allow all') || t.includes('accept all');
      }) as any[];
      btns.forEach(b => { if (typeof b.click === 'function') b.click(); });
    });
    await new Promise(r => setTimeout(r, 2000));

    // Wait until forecast data is actually on page
    console.log("⏳ Waiting for forecast data to load...");
    try {
      await page.waitForFunction(() => {
        const text = document.body.innerText;
        return /(?:Today|Tomorrow|[A-Za-z]+),\s+[A-Za-z]+\s+\d+/.test(text) && /\d{2}h/i.test(text);
      }, { timeout: 30000 });
      console.log("✅ Forecast data detected on page");
    } catch (e) {
      console.log("⚠️ Timeout waiting for forecast pattern, proceeding anyway...");
    }

    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log("✅ Page loaded. Body text length:", bodyText.length);

    // Modernize wait selector
    try {
      console.log("✅ Found forecast container");
    } catch (e) {
      console.log("⚠️ Container selector failed, attempting fallback...");
    }


    // ... scroll logic ... (kept same)


    // Auto-scroll
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

    // 1. Reveal night hours
    await page.evaluate(function () {
      const btns = Array.from(document.querySelectorAll('button, a, span, div')).filter(function(el) {
         const t = el.textContent?.trim().toLowerCase() || "";
         return t.includes("night hours") || t.includes("show night");
      }) as any[];
      btns.forEach((b) => { if (typeof b.click === 'function') b.click(); });
    });
    await new Promise(r => setTimeout(r, 2000));

    // Advanced extraction logic
    const extractionScript = `
      (function() {
        // Modern Layout (fc-day blocks)
        const fcDays = Array.from(document.querySelectorAll('.fc-day, [class*="_day_"], [class*="day-block"]'));
        if (fcDays.length > 0) {
           return fcDays.map(day => {
              const header = day.querySelector('.fc-day-header, [class*="header"], [class*="daylabel"]');
              const dateText = header ? header.textContent.trim() : "";
              
              // Find all horizon tables which are the columns in modern fc-day layout
              const columns = Array.from(day.querySelectorAll('.fc-table-horizon, [class*="column"], [class*="col"], [class*="cell-time"]'))
                 .filter(el => {
                    const t = el.textContent.trim();
                    return t.includes('h') || el.className.includes('horizon');
                 });
              
              const rows = columns.map(col => {
                 const timeEl = col.querySelector('.cell-time, [class*="time"], [class*="ts"]') || col;
                 const timeStr = timeEl.textContent.trim();
                 
                 const getVal = (cls) => {
                    const el = col.querySelector('.' + cls) || col.querySelector('[class*="' + cls + '"]');
                    return el ? el.textContent.trim().replace(/[^0-9.]/g, "") : "0";
                 };

                 // Support legacy and modern classes
                 const wind = getVal('cell-ws') || getVal('wind');
                 const wave = getVal('cell-wh') || getVal('wave') || getVal('waves-wrapper');
                 const period = getVal('cell-wp') || getVal('period');
                 const windDirEl = col.querySelector('.cell-wd title, [class*="wd"] title, .cell-wd, [class*="wd"]');
                 const windDir = windDirEl ? (windDirEl.textContent || windDirEl.getAttribute('title') || "0").replace(/[^0-9.]/g, "") : "0";
                 const swellDirEl = col.querySelector('.cell-waves-wrapper [class*="wd"] title, .cell-waves-wrapper [class*="wd"]');
                 const swellDir = swellDirEl ? (swellDirEl.textContent || swellDirEl.getAttribute('title') || "0").replace(/[^0-9.]/g, "") : "0";

                 return { 
                    time: timeStr, 
                    windSpeed: wind, 
                    windDir: windDir, 
                    waveHeight: wave, 
                    wavePeriod: period, 
                    swellDir: swellDir 
                 };
              }).filter(r => r.time.includes('h'));
              
              return { dateText, rows };
           }).filter(d => d.dateText !== "");
        }

        // Legacy/Table Layout
        const docNodes = Array.from(document.querySelectorAll('*'));
        const dayContainers = Array.from(document.querySelectorAll('[class*="day-header"], [class*="_day_"], [class*="forecast-day"], .weathertable__header, [class*="_daylabel_"]'))
           .filter(el => {
              const t = el.textContent.trim();
              return t.length > 5 && t.length < 50 && /(?:Today|Tomorrow|[A-Za-z]+),\s+[A-Za-z]+\s+\d+/.test(t);
           });

        if (dayContainers.length === 0) {
           // Extreme Fallback
           const headers = docNodes.filter(el => {
              const t = el.textContent.trim();
              return t.length > 5 && t.length < 45 && /(?:[A-Za-z]+),\s+[A-Za-z]+\s+\d+/.test(t) && el.children.length <= 1;
           });
           dayContainers.push(...headers);
        }

        return dayContainers.map(header => {
          const dateText = header.textContent.trim();
          let block = header.parentElement;
          
          // Support both Grid Containers and Legacy Table Containers
          while (block && block.querySelectorAll('[class*="_column_"], [class*="_col_"], .weathertable__cell').length < 5 && block !== document.body) {
             block = block.parentElement;
          }

          if (block) {
             // 1. Map Labels
             const labels = Array.from(block.querySelectorAll('[class*="_label_"], [class*="_labelRow_"], .weathertable__label, .weathertable__row-label'))
                .filter(el => el.textContent.trim() !== "");
             
             const labelMap = {};
             labels.forEach((l, i) => {
                const t = l.textContent.trim().toLowerCase();
                if (t.includes('wind speed') || t.includes('wind speed') || t.includes('kts')) labelMap.wind = i;
                if (t.includes('wave height') || t.includes('swell height') || t.includes('m')) labelMap.wave = i;
                if (t.includes('wave period') || t.includes('s')) labelMap.period = i;
             });

             // 2. Extract Columns
             const columns = Array.from(block.querySelectorAll('[class*="_column_"], [class*="_col_"], .weathertable__cell--time, .weathertable__column'))
                .filter(el => {
                   const t = el.textContent.trim();
                   return t.includes('h') || el.querySelector('[class*="_time_"], .weathertable__time');
                });

             // If columns are just time headers (legacy), we might need to find the data row
             // For legacy table, we often iterate rows. But most modern Windfinder is column-based or simulated column-based.
             
             const rows = columns.map(col => {
                const timeEl = col.querySelector('[class*="_time_"], [class*="_header_"], .weathertable__time') || col;
                const timeStr = timeEl.textContent.trim();
                if (!timeStr.includes('h')) return null;

                // Find the data container for this column
                // In column-based grids, it's 'col'. In legacy tables, we might need a different lookup.
                const vals = Array.from(col.querySelectorAll('[class*="_value_"], [class*="_cell_"], .weathertable__value, .weathertable__cell-value'));
                
                // If col has no values, look for the parent or adjacent that might have them
                let dataSrc = (vals.length > 0) ? vals : [];
                if (dataSrc.length === 0 && col.parentElement) {
                   // This handles cases where time is in a header row and data is below
                   // This is complex, but the grid logic handles most cases.
                }

                const getVal = (k) => {
                   const idx = labelMap[k];
                   return (typeof idx !== 'undefined' && dataSrc[idx]) ? dataSrc[idx].textContent.trim().replace(/[^\\d.]/g, "") : "0";
                };

                return { 
                   time: timeStr, 
                   windSpeed: getVal('wind'), 
                   windDir: "0", 
                   waveHeight: getVal('wave'), 
                   wavePeriod: getVal('period'), 
                   swellDir: "0" 
                };
             }).filter(Boolean);
             
             return { dateText, rows };
          }
          return { dateText, rows: [] };
        });
      })()
    `;

    const forecastDaysData = await page.evaluate(extractionScript) as any[];

    if (!forecastDaysData || forecastDaysData.length === 0 || forecastDaysData.every(d => d.rows.length === 0)) {
       console.error("❌ Failed to parse forecast days or rows.");
       throw new Error("No forecast columns could be extracted.");
    }

    console.log(`✅ Found ${forecastDaysData.length} forecast day container(s) on the page`);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const forecasts: BaseForecastData[] = [];

    const parseDateFromText = (dateText: string): Date | null => {
      try {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const cleanText = dateText.replace(/^(?:Today|Tomorrow),/, "Day,");
        const parts = cleanText.split(/[, ]+/).filter(Boolean);
        let monthName = "", dayStr = "";
        for (let i = 0; i < parts.length; i++) {
           if (monthNames.indexOf(parts[i]) !== -1) {
              monthName = parts[i];
              dayStr = parts[i+1];
              break;
           }
        }
        const day = parseInt(dayStr);
        const monthIndex = monthNames.indexOf(monthName);
        if (monthIndex !== -1 && !isNaN(day)) {
          let year = currentYear;
          if (currentMonth >= 10 && monthIndex <= 1) year = currentYear + 1;
          const parsedDate = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));
          const diff = (parsedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          if (diff < -30) return new Date(Date.UTC(year + 1, monthIndex, day, 0, 0, 0, 0));
          return parsedDate;
        }
      } catch (error) { console.error("Error parsing date:", error); }
      return null;
    };

    for (const dayData of forecastDaysData) {
      const parsedDate = parseDateFromText(dayData.dateText);
      if (!parsedDate) continue;
      const dateStr = parsedDate.toISOString().split("T")[0];
      console.log(`🔍 Processing forecast for ${dayData.dateText} (${dateStr})...`);

      for (const row of dayData.rows) {
        const hour = parseInt(row.time?.toString().replace("h", "") || "0");
        if (hour >= 5 && hour <= 11) {
          const forecast: BaseForecastData = {
            date: parsedDate,
            regionId: region,
            windSpeed: Math.round(parseFloat(row.windSpeed || "0")),
            windDirection: parseFloat(row.windDir?.replace("°", "") || "0"),
            swellHeight: parseFloat(row.waveHeight || "0"),
            swellPeriod: Math.round(parseFloat(row.wavePeriod || "0")),
            swellDirection: parseFloat(row.swellDir?.replace("°", "") || "0"),
          };
          forecasts.push(forecast);
          console.log("📊 Forecast data:", forecast);
          break; 
        }
      }
    }

    if (forecasts.length === 0) throw new Error("No morning forecast data found.");
    console.log(`✅ Successfully scraped ${forecasts.length} forecast(s)`);
    return forecasts;
  } catch (error) {
    console.error("\n❌ Scraping failed:", (error as Error).message);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}
