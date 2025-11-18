import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { USER_AGENTS } from "@/app/lib/proxy/userAgents";
import { ProxyManager } from "@/app/lib/proxy/proxyManager";
import { BaseForecastData } from "@/app/types/forecast";

const proxyManager = new ProxyManager();

async function getBrowser() {
  // Check if running on Vercel (serverless environment)
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;

  if (!isVercel && process.env.NODE_ENV === "development") {
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
    // Production Vercel/serverless environment - use @sparticuz/chromium
    console.log("Using @sparticuz/chromium for Vercel serverless environment");
    chromium.setGraphicsMode = false; // Disable graphics mode for serverless
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
  return Math.round(knots * 0.514444 * 10) / 10; // Convert to m/s and round to 1 decimal
};

// Parse wind direction from Windguru format (degrees or cardinal)
const parseWindDirection = (value: string | null): number => {
  if (!value) return 0;

  // Remove any non-numeric characters except decimal point
  const numericValue = value.replace(/[^\d.]/g, "");
  const degrees = parseFloat(numericValue);

  if (!isNaN(degrees)) {
    return degrees;
  }

  // If it's a cardinal direction, convert it
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
): Promise<BaseForecastData> {
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
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
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
    await page.waitForSelector(".tabulka", { timeout: 15000 });
    console.log("✅ Found Windguru table");

    // Wait for table to fully load
    await page.waitForTimeout(4000);

    const forecastData = await page.evaluate(() => {
      // Try to find the table - it might be in different containers
      let table = document.querySelector(".tabulka");
      if (!table) {
        // Fallback: look for table with class containing 'tabulka'
        table = document.querySelector("table[class*='tabulka']");
      }
      if (!table) {
        console.error("Could not find Windguru table");
        return null;
      }

      // Find the dates row to get timestamps and column indices
      let datesRow = table.querySelector("tr.tr_dates");
      if (!datesRow) {
        // Try alternative selector
        datesRow = table.querySelector("tr[class*='dates']");
      }
      if (!datesRow) {
        console.error("Could not find dates row");
        return null;
      }

      const dateCells = Array.from(datesRow.querySelectorAll("td.tcell"));
      const timeColumns: Array<{
        index: number;
        hour: number;
        unixtime: number;
      }> = [];

      dateCells.forEach((cell, index) => {
        const dataX = cell.getAttribute("data-x");
        if (dataX) {
          try {
            const data = JSON.parse(dataX);
            const unixtime = data.unixtime;
            if (unixtime) {
              const date = new Date(unixtime * 1000);
              const hour = date.getUTCHours();
              timeColumns.push({ index, hour, unixtime });
            }
          } catch (e) {
            // Skip invalid data
          }
        }
      });

      // Find parameter rows - try multiple selector strategies
      const getParamRow = (paramId: string) => {
        // Try multiple ID patterns (tabid_0_0_PARAM, tabid_1_0_PARAM, etc.)
        let row = null;
        for (let i = 0; i < 5; i++) {
          row = table.querySelector(`tr#tabid_${i}_0_${paramId}`);
          if (row) break;
        }

        if (!row) {
          // Fallback to class selector
          row = table.querySelector(`tr.param.${paramId}`);
        }
        if (!row) {
          // Try attribute selector
          row = table.querySelector(`tr[class*="${paramId}"]`);
        }
        if (!row) {
          // Last resort: find by ID containing paramId
          const allRows = table.querySelectorAll("tr");
          for (const r of Array.from(allRows)) {
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

        const cells = Array.from(row.querySelectorAll("td.tcell"));
        return cells.map((cell) => {
          // Get text content, handling nested elements
          const text = cell.textContent?.trim() || "";
          // Also check for data attributes that might contain values
          const dataValue =
            cell.getAttribute("data-value") || cell.getAttribute("data-x");
          return dataValue || text;
        });
      };

      const windSpeedRow = getParamRow("WINDSPD"); // Wind speed in knots
      const windDirRow = getParamRow("SMER"); // Wind direction
      const waveHeightRow = getParamRow("HTSGW"); // Wave height in meters
      const wavePeriodRow = getParamRow("PERPW"); // Wave period in seconds
      const waveDirRow = getParamRow("DIRPW"); // Wave direction

      if (
        !windSpeedRow ||
        !windDirRow ||
        !waveHeightRow ||
        !wavePeriodRow ||
        !waveDirRow
      ) {
        return null;
      }

      // Find morning hours (5h-11h) and get the first matching column
      for (const timeCol of timeColumns) {
        if (timeCol.hour >= 5 && timeCol.hour <= 11) {
          const colIndex = timeCol.index;

          // Extract values from the corresponding column
          const windSpeed = windSpeedRow[colIndex] || "";
          const windDir = windDirRow[colIndex] || "";
          const waveHeight = waveHeightRow[colIndex] || "";
          const wavePeriod = wavePeriodRow[colIndex] || "";
          const waveDir = waveDirRow[colIndex] || "";

          return {
            hour: timeCol.hour,
            unixtime: timeCol.unixtime,
            windSpeed,
            windDir,
            waveHeight,
            wavePeriod,
            waveDir,
          };
        }
      }

      return null;
    });

    if (!forecastData) {
      throw new Error(
        "Failed to parse Windguru table or no morning forecast found"
      );
    }

    console.log("🔍 Parsed forecast data:", forecastData);

    // Convert and parse the data
    const windSpeedKnots = parseFloat(forecastData.windSpeed) || 0;
    const windSpeedMs = knotsToMs(windSpeedKnots); // Convert knots to m/s
    const windDirection = parseWindDirection(forecastData.windDir);
    const swellHeight = parseFloat(forecastData.waveHeight) || 0;
    const swellPeriod = parseInt(forecastData.wavePeriod) || 0;
    const swellDirection = parseWaveDirection(forecastData.waveDir);

    // Create date from unixtime
    const forecastDate = new Date(forecastData.unixtime * 1000);
    forecastDate.setUTCHours(1, 0, 0, 0); // Set to start of day

    const forecast: BaseForecastData = {
      date: forecastDate,
      regionId: region,
      windSpeed: windSpeedMs,
      windDirection: windDirection,
      swellHeight: swellHeight,
      swellPeriod: swellPeriod,
      swellDirection: swellDirection,
    };

    console.log("✅ Successfully scraped forecast data:", forecast);
    proxyManager.reportProxySuccess(proxy.host, Date.now() - startTime);
    return forecast;
  } catch (error) {
    console.error("\n❌ Windguru scraping failed:", {
      url,
      region,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    if (proxy) {
      proxyManager.reportProxyFailure(proxy.host);
    }
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("\n🔚 Browser closed");
    }
  }
}
