import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { WindData } from "../../types/wind";
import { USER_AGENTS } from "@/app/lib/proxy/userAgents";
import { ProxyManager } from "@/app/lib/proxy/proxyManager";
import { ProxyConfig } from "@/app/lib/proxy/types";
import { createHash } from "crypto";

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
  if (process.env.NODE_ENV === "development") {
    // For local development, use Chrome/Chromium installed on the system
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
    // Production Vercel environment
    return puppeteerCore.launch({
      args: [...chromium.args, "--no-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
      ignoreHTTPSErrors: true,
    });
  }
}

export async function scraperA(url: string, region: string): Promise<WindData> {
  console.log("\n=== Starting Puppeteer Scraper ===");
  let browser = null;
  const proxy = proxyManager.getProxyForRegion(region);
  const startTime = Date.now();

  try {
    browser = await getBrowser();

    const page = await browser.newPage();
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
    await page.waitForSelector(".weathertable", { timeout: 15000 });
    console.log("✅ Found weather table");

    await page.waitForTimeout(4000);

    const cleanHtml = await page.evaluate(() => {
      const table = document.querySelector(".weathertable");
      if (!table) return null;

      return Array.from(table.querySelectorAll(".weathertable__row")).map(
        (row) => ({
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
        })
      );
    });

    if (!cleanHtml) {
      throw new Error("Failed to parse weather table");
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let forecast: WindData | null = null;

    cleanHtml.forEach((row) => {
      const timeStr = row.time?.toString() || "";
      const hour = parseInt(timeStr.replace("h", ""));

      if (hour >= 5 && hour <= 11) {
        forecast = {
          windSpeed: parseInt(row.windSpeed || "0"),
          windDirection: parseFloat(row.windDir?.replace("°", "") || "0"),
          swellHeight: parseFloat(row.waveHeight || "0"),
          swellPeriod: parseInt((row.wavePeriod || "0").replace(/\s+s$/, "")),
          swellDirection: parseFloat(row.swellDir?.replace("°", "") || "0"),
          date: today,
          region,
        };
        return;
      }
    });

    if (!forecast) {
      throw new Error("No morning forecast data found between 05h-11h");
    }

    proxyManager.reportProxySuccess(proxy.host, Date.now() - startTime);
    return forecast;
  } catch (error) {
    if (proxy) {
      proxyManager.reportProxyFailure(proxy.host);
    }
    console.error("\n❌ Error in Puppeteer scraper:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("\n🔚 Browser closed");
    }
  }
}
