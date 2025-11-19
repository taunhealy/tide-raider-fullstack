import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
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
    
    console.log(`[scraperB] 🔍 Waiting for Windguru table selector (.tabulka)...`);
    try {
      await page.waitForSelector(".tabulka", { timeout: 15000 });
      console.log("✅ Found Windguru table (.tabulka)");
    } catch (selectorError) {
      console.error(`[scraperB] ❌ Could not find .tabulka selector, trying alternatives...`);
      // Try alternative selectors
      const altSelectors = ["table[class*='tabulka']", "table.tabulka", ".forecast-table", "table"];
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
        console.error(`[scraperB] ❌ Page content (first 2000 chars):`, pageContent.substring(0, 2000));
        throw new Error("Could not find Windguru forecast table on page");
      }
    }

    console.log(`[scraperB] ⏳ Waiting 4 seconds for table to fully load...`);
    await page.waitForTimeout(4000);

    console.log(`[scraperB] 🔍 Extracting forecast data from page...`);
    const forecastData = await page.evaluate(() => {
      console.log("[scraperB] [page.evaluate] Starting data extraction...");
      // @ts-ignore
      let table = document.querySelector(".tabulka");
      console.log("[scraperB] [page.evaluate] Looking for .tabulka:", !!table);
      if (!table) {
        // @ts-ignore
        table = document.querySelector("table[class*='tabulka']");
        console.log("[scraperB] [page.evaluate] Looking for table[class*='tabulka']:", !!table);
      }
      if (!table) {
        // @ts-ignore
        const allTables = document.querySelectorAll("table");
        console.error(`[scraperB] [page.evaluate] Could not find Windguru table. Found ${allTables.length} table(s) on page`);
        // @ts-ignore
        allTables.forEach((t, i) => {
          console.log(`[scraperB] [page.evaluate] Table ${i}: classes="${t.className}", id="${t.id}"`);
        });
        return null;
      }
      console.log("[scraperB] [page.evaluate] ✅ Table found");

      // Find the dates row to get timestamps and column indices
      // @ts-ignore
      let datesRow = table.querySelector("tr.tr_dates");
      console.log("[scraperB] [page.evaluate] Looking for tr.tr_dates:", !!datesRow);
      if (!datesRow) {
        // @ts-ignore
        datesRow = table.querySelector("tr[class*='dates']");
        console.log("[scraperB] [page.evaluate] Looking for tr[class*='dates']:", !!datesRow);
      }
      if (!datesRow) {
        // @ts-ignore
        const allRows = table.querySelectorAll("tr");
        console.error(`[scraperB] [page.evaluate] Could not find dates row. Found ${allRows.length} row(s) in table`);
        // @ts-ignore
        Array.from(allRows).slice(0, 5).forEach((r: any, i) => {
          console.log(`[scraperB] [page.evaluate] Row ${i}: classes="${r.className}", id="${r.id}"`);
        });
        return null;
      }
      console.log("[scraperB] [page.evaluate] ✅ Dates row found");

      // @ts-ignore
      const dateCells = Array.from(datesRow.querySelectorAll("td.tcell"));
      console.log(`[scraperB] [page.evaluate] Found ${dateCells.length} date cells`);
      const timeColumns: Array<{
        index: number;
        hour: number;
        unixtime: number;
        date: Date;
      }> = [];

      dateCells.forEach((cell: any, index: number) => {
        const dataX = cell.getAttribute("data-x");
        if (dataX) {
          try {
            const data = JSON.parse(dataX);
            const unixtime = data.unixtime;
            if (unixtime) {
              const date = new Date(unixtime * 1000);
              const hour = date.getUTCHours();
              timeColumns.push({ index, hour, unixtime, date });
              console.log(`[scraperB] [page.evaluate] Time column ${index}: hour=${hour}, unixtime=${unixtime}, date=${date.toISOString()}`);
            } else {
              console.log(`[scraperB] [page.evaluate] Cell ${index}: data-x found but no unixtime`, data);
            }
          } catch (e) {
            console.log(`[scraperB] [page.evaluate] Cell ${index}: Failed to parse data-x="${dataX}":`, e);
          }
        } else {
          console.log(`[scraperB] [page.evaluate] Cell ${index}: No data-x attribute`);
        }
      });
      
      console.log(`[scraperB] [page.evaluate] Extracted ${timeColumns.length} time columns`);

      // Find parameter rows
      const getParamRow = (paramId: string) => {
        let row = null;
        for (let i = 0; i < 5; i++) {
          // @ts-ignore
          row = table.querySelector(`tr#tabid_${i}_0_${paramId}`);
          if (row) break;
        }

        if (!row) {
          // @ts-ignore
          row = table.querySelector(`tr.param.${paramId}`);
        }
        if (!row) {
          // @ts-ignore
          row = table.querySelector(`tr[class*="${paramId}"]`);
        }
        if (!row) {
          // @ts-ignore
          const allRows = table.querySelectorAll("tr");
          for (const r of Array.from(allRows) as any[]) {
            if (r.id && r.id.includes(paramId)) {
              row = r;
              break;
            }
          }
        }

        if (!row) {
          console.error(`Could not find row for parameter: ${paramId}`);
          return null;
        }

        // @ts-ignore
        const cells = Array.from(row.querySelectorAll("td.tcell"));
        return cells.map((cell: any, cellIndex: number) => {
          // Get all possible value sources
          const text = cell.textContent?.trim() || "";
          const innerText = cell.innerText?.trim() || "";
          const dataValue = cell.getAttribute("data-value");
          const dataX = cell.getAttribute("data-x");
          
          // Log first few cells for debugging
          if (cellIndex < 3) {
            console.log(`[scraperB] [page.evaluate] Cell ${cellIndex} for ${paramId}:`, {
              text,
              innerText,
              dataValue,
              dataX,
              html: cell.innerHTML?.substring(0, 100),
            });
          }
          
          // Priority 1: Use data-value if it exists and is not JSON metadata
          if (dataValue && !dataValue.startsWith("{")) {
            return dataValue;
          }
          
          // Priority 2: Use text content (most reliable for Windguru)
          const content = innerText || text;
          if (content && content.length > 0) {
            // For directions (wind/wave direction), return as-is if it's a cardinal direction
            if (/^[NSEW]+$/.test(content)) {
              return content;
            }
            // For numeric values, clean and return
            const numericMatch = content.match(/[\d.]+/);
            if (numericMatch) {
              return numericMatch[0];
            }
            // Return original if no numeric found (might be a special format)
            return content;
          }
          
          // Priority 3: Check for nested elements with values
          // @ts-ignore
          const valueElement = cell.querySelector(".value, .data-value, [data-value], span, div");
          if (valueElement) {
            const nestedText = valueElement.textContent?.trim() || valueElement.innerText?.trim();
            const nestedDataValue = valueElement.getAttribute("data-value");
            if (nestedText && nestedText.length > 0) {
              const numericMatch = nestedText.match(/[\d.]+/);
              if (numericMatch) return numericMatch[0];
              return nestedText;
            }
            if (nestedDataValue && !nestedDataValue.startsWith("{")) {
              return nestedDataValue;
            }
          }
          
          // If all else fails, return empty string (will be parsed as 0)
          if (cellIndex < 3) {
            console.log(`[scraperB] [page.evaluate] ⚠️ Could not extract value from cell ${cellIndex}. Returning empty string.`);
          }
          return "";
        });
      };

      console.log("[scraperB] [page.evaluate] Extracting parameter rows...");
      const windSpeedRow = getParamRow("WINDSPD");
      console.log(`[scraperB] [page.evaluate] WINDSPD row:`, windSpeedRow ? `found (${windSpeedRow.length} cells)` : "NOT FOUND");
      const windDirRow = getParamRow("SMER");
      console.log(`[scraperB] [page.evaluate] SMER row:`, windDirRow ? `found (${windDirRow.length} cells)` : "NOT FOUND");
      const waveHeightRow = getParamRow("HTSGW");
      console.log(`[scraperB] [page.evaluate] HTSGW row:`, waveHeightRow ? `found (${waveHeightRow.length} cells)` : "NOT FOUND");
      const wavePeriodRow = getParamRow("PERPW");
      console.log(`[scraperB] [page.evaluate] PERPW row:`, wavePeriodRow ? `found (${wavePeriodRow.length} cells)` : "NOT FOUND");
      const waveDirRow = getParamRow("DIRPW");
      console.log(`[scraperB] [page.evaluate] DIRPW row:`, waveDirRow ? `found (${waveDirRow.length} cells)` : "NOT FOUND");

      if (
        !windSpeedRow ||
        !windDirRow ||
        !waveHeightRow ||
        !wavePeriodRow ||
        !waveDirRow
      ) {
        console.error("[scraperB] [page.evaluate] ❌ Missing required parameter rows");
        return null;
      }
      
      console.log("[scraperB] [page.evaluate] ✅ All parameter rows found");

      // Group time columns by date and find morning hours for each date
      const forecastsByDate: Map<string, any> = new Map();

      console.log(`[scraperB] [page.evaluate] Processing ${timeColumns.length} time columns for morning hours (5-11)...`);
      for (const timeCol of timeColumns) {
        if (timeCol.hour >= 5 && timeCol.hour <= 11) {
          const dateKey = timeCol.date.toISOString().split("T")[0];

          if (!forecastsByDate.has(dateKey)) {
            const colIndex = timeCol.index;
            const windSpeed = windSpeedRow[colIndex] || "";
            const windDir = windDirRow[colIndex] || "";
            const waveHeight = waveHeightRow[colIndex] || "";
            const wavePeriod = wavePeriodRow[colIndex] || "";
            const waveDir = waveDirRow[colIndex] || "";

            console.log(`[scraperB] [page.evaluate] Column ${colIndex} (${dateKey} ${timeCol.hour}:00):`, {
              windSpeed,
              windDir,
              waveHeight,
              wavePeriod,
              waveDir,
            });

            forecastsByDate.set(dateKey, {
              date: timeCol.date,
              hour: timeCol.hour,
              unixtime: timeCol.unixtime,
              windSpeed,
              windDir,
              waveHeight,
              wavePeriod,
              waveDir,
            });
          }
        } else {
          console.log(`[scraperB] [page.evaluate] Skipping column ${timeCol.index} (hour ${timeCol.hour} not in 5-11 range)`);
        }
      }

      const result = Array.from(forecastsByDate.values());
      console.log(`[scraperB] [page.evaluate] ✅ Extracted ${result.length} forecast(s) for morning hours`);
      return result;
    });

    if (!forecastData || forecastData.length === 0) {
      console.error(`[scraperB] ❌ No forecast data extracted from page`);
      throw new Error(
        "Failed to parse Windguru table or no morning forecast found"
      );
    }

    console.log(`[scraperB] 🔍 Raw forecast data extracted (${forecastData.length} item(s)):`, JSON.stringify(forecastData, null, 2));

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

    console.log(`[scraperB] ✅ Successfully scraped ${forecasts.length} forecast(s):`, JSON.stringify(forecasts, null, 2));
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
