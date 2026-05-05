// @ts-nocheck

import { getBrowser } from "./browser";
import { USER_AGENTS } from "../proxy/userAgents";
import { ProxyManager } from "../proxy/proxyManager";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { BaseForecastData } from "../types";

const proxyManager = new ProxyManager();

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
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 1000 }
    });
    const page = await context.newPage();
    
    page.on('console', msg => console.log(`[Browser] ${msg.text()}`));



    // Anti-bot measures
    await page.addInitScript(() => {
      // @ts-ignore
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    /*
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (["image", "font", "stylesheet"].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });
    */
    console.log(`[scraperA] 🌐 Navigating to ${url}...`);
    let navigationSuccessful = false;
    let attempts = 0;
    let currentUrl = url;

    while (attempts < 2 && !navigationSuccessful) {
      try {
        attempts++;
        // Use networkidle2 for more reliable loading of dynamic content
        await page.goto(currentUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
        
        // Wait a bit extra for Astro/JS components to hydrate
        await new Promise(r => setTimeout(r, 2000));

        // Check if we actually see forecast rows - added more inclusive selectors for Superforecast/CSS Modules
        const hasRows = await page.evaluate(() => {
          const selectors = [
            '.forecast-row', 
            '[class*="row"]', 
            '.forecast-tab', 
            '.forecast-day', 
            '[class*="day-wrapper"]',
            '[class*="Container"]',
            '[class*="label"]',
            '[class*="hour"]',
            '.fc-table-horizon'
          ];
          return selectors.some(s => !!document.querySelector(s));
        });

        if (hasRows) {
          navigationSuccessful = true;
          console.log(`✅ Forecast detected on attempt ${attempts} at ${currentUrl}`);
        } else {
          throw new Error("No forecast rows detected in DOM");
        }
      } catch (e) {
        console.log(`⚠️ Attempt ${attempts} failed for ${currentUrl}: ${e.message}`);
        if (attempts < 2) {
          console.log("🔄 Retrying with Basic Forecast fallback URL...");
          currentUrl = currentUrl.includes('weatherforecast') ? currentUrl.replace('weatherforecast', 'forecast') : currentUrl;
          if (currentUrl.includes('?')) currentUrl = currentUrl.split('?')[0];
        }
      }
    }
 
    if (!navigationSuccessful) {
      throw new Error("Failed to load forecast data after fallback attempts.");
    }

    // Handle Cookie Consent (Aggressive)
    await page.evaluate(function () {
      const selectors = ['#ok', '#accept', '.accept', '[id*="consent"]', '[class*="consent"]', 'button'];
      selectors.forEach(s => {
        const els = Array.from(document.querySelectorAll(s));
        els.forEach((el: any) => {
          const t = el.textContent?.toLowerCase() || "";
          if (t.includes('accept') || t.includes('agree') || t.includes('consent')) {
            try { el.click(); } catch(e) {}
          }
        });
      });
    });
    await new Promise(r => setTimeout(r, 2000));

    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log("✅ Page content ready. Text length:", bodyText.length);

    // Auto-scroll to trigger lazy loading
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

    // Ensure we can see night/early morning hours (for 05h-11h)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, div')).filter(el => {
        const t = el.textContent.toLowerCase();
        return t.includes("night hours") || t.includes("show night");
      }) as any[];
      if (btns.length > 0 && typeof btns[0].click === 'function') {
        try { btns[0].click(); } catch(e) {}
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    // Advanced extraction logic
    // @ts-ignore - __dirname is available in Node.js
    const evalCodePath = join(__dirname, "windfinder-eval.js");
    const evalCode = readFileSync(evalCodePath, "utf-8");

    let forecastDaysData: any[] = [];
    try {
      forecastDaysData = await page.evaluate(`
        ${evalCode}
        extractWindfinderData();
      `) as any[];
    } catch (evalErr) {
      console.error("❌ JavaScript error during windfinder extraction:", evalErr);
      throw evalErr;
    }

    if (!forecastDaysData || forecastDaysData.length === 0 || forecastDaysData.every(d => d.rows.length === 0)) {
       console.error("❌ Failed to parse forecast days or rows.");
       throw new Error("No forecast columns could be extracted.");
    }

    console.log(`✅ Found ${forecastDaysData.length} forecast day container(s) on the page`);
    console.log(`📊 Tide Data Sample:`, forecastDaysData[0].rows.map(r => `${r.time}: ${r.tide || 'none'}`).join(', '));

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const forecasts: BaseForecastData[] = [];

    const parseDateFromText = (dateText: string): Date | null => {
      try {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        // Support formats like "Monday, 20 Apr" or "Apr 20"
        const cleanText = dateText.replace(/^(?:Today|Tomorrow|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),/i, "Day,");
        const parts = cleanText.split(/[, ]+/).filter(Boolean);
        
        let monthIndex = -1;
        let day = NaN;

        for (let i = 0; i < parts.length; i++) {
          const mIdx = monthNames.findIndex(m => parts[i].startsWith(m));
          if (mIdx !== -1) {
            monthIndex = mIdx;
            // Day could be before or after
            const prev = parseInt(parts[i-1]);
            const next = parseInt(parts[i+1]);
            day = !isNaN(prev) ? prev : next;
            break;
          }
        }

        if (monthIndex !== -1 && !isNaN(day)) {
          let year = currentYear;
          if (currentMonth >= 10 && monthIndex <= 1) year = currentYear + 1;
          const parsedDate = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));
          return parsedDate;
        }
      } catch (error) { console.error("Error parsing date:", error); }
      return null;
    };

    for (const dayData of forecastDaysData) {
      console.log(`📅 Day: ${dayData.dateText} found with ${dayData.rows?.length || 0} rows`);
      const parsedDate = parseDateFromText(dayData.dateText);
      if (!parsedDate) {
        console.warn(`⚠️ Failed to parse date for: ${dayData.dateText}`);
        continue;
      }
      const dateStr = parsedDate.toISOString().split("T")[0];
      console.log(`🔍 Processing forecast for ${dayData.dateText} (${dateStr})...`);
      
      if (dayData.rows?.length > 0) {
        console.log(`   Rows: ${dayData.rows.map(r => r.time).join(", ")}`);
      }

      // Flexible slot matching for Windfinder's 3-hour intervals (02, 05, 08, 11, 14, 17, 20, 23)
      for (const row of (dayData.rows || [])) {
        if (!row || !row.time) continue;
        
        const hourStr = row.time.toString().replace(/[^0-9]/g, "");
        const hour = parseInt(hourStr);
        if (isNaN(hour)) {
          console.warn(`⚠️ Invalid hour: ${row.time}`);
          continue;
        }

        let slot: "MORNING" | "NOON" | "EVENING" | null = null;
        
        // Map hours to slots (now with more flexibility for Superforecast)
        if ([5, 6, 7, 8, 9].includes(hour)) {
          slot = "MORNING";
        } else if ([11, 12, 13, 14, 15].includes(hour)) {
          slot = "NOON";
        } else if ([17, 18, 19, 20, 21].includes(hour)) {
          slot = "EVENING";
        }

        if (slot) {
          const existingIdx = forecasts.findIndex(f => f.date.getTime() === parsedDate.getTime() && f.timeSlot === slot);
          
          if (existingIdx !== -1) {
            const preferredHours = { MORNING: 8, NOON: 13, EVENING: 19 };
            const target = preferredHours[slot];
            const existingForecast = forecasts[existingIdx] as any;
            const existingHasTide = !!existingForecast.tide;
            const currentHasTide = !!row.tide;
            const existingHour = existingForecast.rawHour || 0;
            
            // Priority: 1. Has Tide, 2. Closer to target hour
            let shouldReplace = false;
            if (currentHasTide && !existingHasTide) {
              shouldReplace = true;
            } else if (currentHasTide === existingHasTide) {
              if (Math.abs(hour - target) < Math.abs(existingHour - target)) {
                shouldReplace = true;
              }
            }

            if (shouldReplace) {
              forecasts.splice(existingIdx, 1);
            } else {
              continue; 
            }
          }

          const fDate = new Date(parsedDate.getTime());
          
          const windDirValue = (row.windDir && typeof row.windDir === 'string') 
            ? (cardinalToDirection[row.windDir.toUpperCase()] ?? parseFloat(row.windDir.replace(/[^-0-9.]/g, ""))) 
            : -1;
          
          const swellDirValue = (row.swellDir && typeof row.swellDir === 'string') 
            ? (cardinalToDirection[row.swellDir.toUpperCase()] ?? parseFloat(row.swellDir.replace(/[^-0-9.]/g, ""))) 
            : -1;

          const tideValue = row.tide 
            ? (row.tideHeight ? `${row.tide} (${row.tideHeight}m)` : row.tide)
            : (row.tideHeight ? `${row.tideHeight}m` : "");

          const forecast: BaseForecastData = {
            date: fDate,
            regionId: region,
            timeSlot: slot,
            windSpeed: Math.round(parseFloat(row.windSpeed || "0") || 0),
            windDirection: isNaN(windDirValue) ? -1 : windDirValue,
            swellHeight: parseFloat(row.waveHeight || "0") || 0,
            swellPeriod: Math.round(parseFloat(row.wavePeriod || "0") || 0),
            swellDirection: isNaN(swellDirValue) ? -1 : swellDirValue,
            tide: tideValue,
          };
          (forecast as any).rawHour = hour;
          forecasts.push(forecast);
          console.log(`   ✅ Mapped ${hour}h -> ${slot} - Tide: ${row.tide || 'NONE'}`);
        }
      }
    }

    // Log a summary for debugging
    const summary = forecasts.reduce((acc, f) => {
      const d = f.date.toISOString().split('T')[0];
      acc[d] = (acc[d] || []).concat(f.timeSlot);
      return acc;
    }, {});

    try {
      const fs = require('fs');
      const path = require('path');
      const scratchDir = path.join(process.cwd(), 'scratch');
      if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir);
      fs.writeFileSync(path.join(scratchDir, 'scrape_summary.json'), JSON.stringify({
        count: forecasts.length,
        daysFound: forecastDaysData.map(d => d.dateText),
        summary
      }, null, 2));
    } catch (e) {}

    if (forecasts.length === 0) {
      console.error("❌ No forecasts could be mapped to slots.");
      throw new Error("No forecast data found.");
    }
    
    console.log(`✅ Successfully scraped ${forecasts.length} forecast(s) across ${new Set(forecasts.map(f => f.date.toISOString().split('T')[0])).size} days`);
    console.log("Scrape Summary:", JSON.stringify(summary, null, 2));

    return forecasts;
  } catch (error) {
    console.error("\n❌ Scraping failed:", (error as Error).message);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}
