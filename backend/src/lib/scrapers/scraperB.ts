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

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector(".tabulka", { timeout: 15000 });
    console.log("✅ Found Windguru table");

    await page.waitForTimeout(4000);

    const forecastData = await page.evaluate(() => {
      // @ts-ignore
      let table = document.querySelector(".tabulka");
      if (!table) {
        // @ts-ignore
        table = document.querySelector("table[class*='tabulka']");
      }
      if (!table) {
        console.error("Could not find Windguru table");
        return null;
      }

      // Find the dates row to get timestamps and column indices
      // @ts-ignore
      let datesRow = table.querySelector("tr.tr_dates");
      if (!datesRow) {
        // @ts-ignore
        datesRow = table.querySelector("tr[class*='dates']");
      }
      if (!datesRow) {
        console.error("Could not find dates row");
        return null;
      }

      // @ts-ignore
      const dateCells = Array.from(datesRow.querySelectorAll("td.tcell"));
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
            }
          } catch (e) {
            // Skip invalid data
          }
        }
      });

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
        return cells.map((cell: any) => {
          const text = cell.textContent?.trim() || "";
          const dataValue =
            cell.getAttribute("data-value") || cell.getAttribute("data-x");
          return dataValue || text;
        });
      };

      const windSpeedRow = getParamRow("WINDSPD");
      const windDirRow = getParamRow("SMER");
      const waveHeightRow = getParamRow("HTSGW");
      const wavePeriodRow = getParamRow("PERPW");
      const waveDirRow = getParamRow("DIRPW");

      if (
        !windSpeedRow ||
        !windDirRow ||
        !waveHeightRow ||
        !wavePeriodRow ||
        !waveDirRow
      ) {
        return null;
      }

      // Group time columns by date and find morning hours for each date
      const forecastsByDate: Map<string, any> = new Map();

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
        }
      }

      return Array.from(forecastsByDate.values());
    });

    if (!forecastData || forecastData.length === 0) {
      throw new Error(
        "Failed to parse Windguru table or no morning forecast found"
      );
    }

    console.log("🔍 Parsed forecast data:", forecastData);

    // Convert and parse the data for each date
    const forecasts: BaseForecastData[] = [];

    for (const data of forecastData) {
      const windSpeedKnots = parseFloat(data.windSpeed) || 0;
      const windSpeedMs = knotsToMs(windSpeedKnots);
      const windDirection = parseWindDirection(data.windDir);
      const swellHeight = parseFloat(data.waveHeight) || 0;
      const swellPeriod = parseInt(data.wavePeriod) || 0;
      const swellDirection = parseWaveDirection(data.waveDir);

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

      forecasts.push(forecast);
    }

    console.log("✅ Successfully scraped forecast data:", forecasts);
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
