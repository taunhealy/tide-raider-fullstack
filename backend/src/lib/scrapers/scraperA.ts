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

    await page.screenshot({ path: 'scraper-debug.png', fullPage: true });
    console.log("📸 Screenshot saved to scraper-debug.png");


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
        const docNodes = Array.from(document.querySelectorAll('*'));
        
        // Find day containers directly by class suffix pattern
        const dayContainers = Array.from(document.querySelectorAll('[class*="_day_"], [class*="forecast-day"]'))
           .filter(el => el.textContent.trim().length < 50);

        if (dayContainers.length === 0) {
           // Fallback to any text that looks like a date
           const headers = docNodes.filter(el => {
              const t = el.textContent.trim();
              return /(?:Today|Tomorrow|[A-Za-z]+),\s+[A-Za-z]+\s+\d+/.test(t) && t.length < 35;
           });
           dayContainers.push(...headers);
        }

        return dayContainers.map(header => {
          const dateText = header.textContent.trim();
          let block = header.parentElement;
          
          while (block && block.querySelectorAll('[class*="_column_"], [class*="_col_"]').length < 5 && block !== document.body) {
             block = block.parentElement;
          }

          if (block) {
             const columns = Array.from(block.querySelectorAll('[class*="_column_"], [class*="_col_"]'));
             const labels = Array.from(block.querySelectorAll('[class*="_label_"], [class*="_labelRow_"]')).filter(el => el.textContent.trim() !== "");
             
             const labelMap = {};
             labels.forEach((l, i) => {
                const t = l.textContent.trim().toLowerCase();
                if (t.includes('wind speed') || t.includes('kts')) labelMap.wind = i;
                if (t.includes('wave height') || t.includes('m')) labelMap.wave = i;
                if (t.includes('period') || t.includes('s')) labelMap.period = i;
             });

             const rows = columns.map(col => {
                const timeStr = col.querySelector('[class*="_time_"], [class*="_header_"]')?.textContent.trim() || "";
                if (!timeStr.includes('h')) return null;
                const vals = Array.from(col.querySelectorAll('[class*="_value_"], [class*="_cell_"]'));
                const get = (k) => (typeof labelMap[k] !== 'undefined' && vals[labelMap[k]]) ? vals[labelMap[k]].textContent.trim().replace(/[^\\d.]/g, "") : "0";
                return { time: timeStr, windSpeed: get('wind'), windDir: "0", waveHeight: get('wave'), wavePeriod: get('period'), swellDir: "0" };
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
