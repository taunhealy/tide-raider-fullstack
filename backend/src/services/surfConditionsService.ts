import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";
import { REGION_CONFIGS } from "../lib/scrapers/scrapeSources";
import { scraperA } from "../lib/scrapers/scraperA";
import { scraperB } from "../lib/scrapers/scraperB";
import { ScoreService } from "./scoreService";
import { PythonBridge } from "../lib/pythonBridge";
import { sendEmail } from "../lib/email"; // Added for failure alerts

const ADMIN_EMAIL = "taunhealy@gmail.com";

async function sendScrapeFailureAlert(regionId: string, source: string, error: string, url: string) {
  const subject = `⚠️ TACTICAL ALERT: Scraper Failure [${regionId}]`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ff4444; border-radius: 10px;">
      <h2 style="color: #cc0000;">🛰️ Intelligence Signal Lost</h2>
      <p><strong>Region:</strong> ${regionId}</p>
      <p><strong>Source:</strong> ${source}</p>
      <p><strong>URL:</strong> <a href="${url}">${url}</a></p>
      <p><strong>Error:</strong> ${error}</p>
      <hr/>
      <p style="font-size: 12px; color: #666;">This is an automated tactical alert from Tide Raider Backend.</p>
    </div>
  `;
  await sendEmail(ADMIN_EMAIL, subject, html);
}

function getTodayDate() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

const pendingScrapes = new Map<string, Promise<any>>();

export async function getLatestConditions(
  regionId: string,
  forceRefresh = false,
  source: "WINDFINDER" | "WINDGURU" | "WINDY" = "WINDFINDER",
  daysLimit?: number,
  targetDateParam?: Date,
  timeSlotParam?: string,
  startDayOffset: number = 0
) {
  const configRegionId = regionId.toLowerCase();
  const region = REGION_CONFIGS[configRegionId];

  if (!region) {
    throw new Error(`Region ${regionId} not found in configurations`);
  }

  const lookupDate = targetDateParam || getTodayDate();
  lookupDate.setUTCHours(0, 0, 0, 0);

  // Determine active slot for return value fallback
  const hour = new Date().getHours();
  let activeSlot = "MORNING";
  if (hour >= 11 && hour < 16) activeSlot = "NOON";
  else if (hour >= 16) activeSlot = "EVENING";

  // 1. Check database first (Internal Cache)
  if (!forceRefresh) {
    const existingForecast = await prisma.forecast.findFirst({
      where: {
        regionId: region.regionId,
        source: source,
        date: lookupDate,
        timeSlot: (timeSlotParam as any) || activeSlot,
      },
    });

    if (existingForecast) {
      console.log(
        `[getLatestConditions] 📦 Using cached ${source} forecast for ${region.regionId} on ${lookupDate.toISOString().split("T")[0]} slot ${timeSlotParam || activeSlot}`
      );
      return existingForecast;
    }
  }

  // Determine URL based on source
  let scrapeUrl = "";
  const today = getTodayDate();
  const diffDays = Math.round((lookupDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const SUPERFORECAST_LIMIT_DAYS = 3;
  const useRegularForecast = source === "WINDFINDER" && diffDays > SUPERFORECAST_LIMIT_DAYS && !!region.sourceA.forecastUrl;

  if (source === "WINDFINDER") {
    scrapeUrl = useRegularForecast
      ? region.sourceA.forecastUrl!
      : region.sourceA.url;

    console.log(
      `[getLatestConditions] 📅 Date is ${diffDays}d out — using ${useRegularForecast ? "Regular Forecast (10d)" : "Superforecast (3d)"} for ${region.regionId}`
    );
  } else if (source === "WINDGURU") {
    scrapeUrl = region.sourceB?.url || "";
  } else if (source === "WINDY") {
    scrapeUrl = region.sourceC?.url || "";
  }

  if (!scrapeUrl) {
    throw new Error(`Scrape URL not configured for ${region.regionId} source ${source}`);
  }

  console.log(
    `[getLatestConditions] 🔄 Fetching fresh conditions for ${region.regionId} - Source: ${source} - URL: ${scrapeUrl}`
  );

  const runScrapeWithFallback = async (url: string, id: string) => {
    let currentUrl = url;
    try {
      if (source === "WINDFINDER") {
        try {
          return await scraperA(currentUrl, id);
        } catch (err) {
          // If superforecast fails, try regular forecast URL if available and if we aren't already using it
          const isSuperforecast = currentUrl.includes("weatherforecast");
          const regionConfig = REGION_CONFIGS[id];
          if (isSuperforecast && regionConfig?.sourceA?.forecastUrl) {
             const fallbackUrl = regionConfig.sourceA.forecastUrl;
             console.log(`[getLatestConditions] 🔄 Superforecast failed for ${id}, retrying with Regular Forecast URL: ${fallbackUrl}`);
             currentUrl = fallbackUrl; // Update currentUrl for semantic fallback if this also fails
             return await scraperA(fallbackUrl, id);
          }
          throw err;
        }
      }
      if (source === "WINDGURU") return await scraperB(currentUrl, id);
      return [];
    } catch (err) {
      console.error(`[getLatestConditions] ❌ Scrape failed for ${url}:`, err);
      try {
        console.log(`[getLatestConditions] 🧠 Attempting semantic scrape with Gemini...`);
        const semanticResults = await PythonBridge.runSemanticScrape(url, id);
        if (semanticResults && semanticResults.length > 0) return semanticResults;
        throw new Error("Semantic scrape returned no data");
      } catch (semanticErr) {
        console.error(`[getLatestConditions] ❌ ALL SCRAPE FALLBACKS FAILED for ${url}:`, semanticErr);
        
        // Final tactical alert to admin
        await sendScrapeFailureAlert(regionId, source, (semanticErr as Error).message, url);
        
        return [];
      }
    }
  };

  const scrapeKey = `${regionId}-${source}`;
  if (pendingScrapes.has(scrapeKey)) {
    console.log(`[getLatestConditions] ⏳ Scrape already in progress for ${scrapeKey}, waiting for promise...`);
    await pendingScrapes.get(scrapeKey);
    
    // After waiting, check DB again
    const refreshedForecast = await prisma.forecast.findFirst({
      where: {
        date: lookupDate,
        regionId: region.regionId,
        source: source,
        timeSlot: (timeSlotParam as any) || activeSlot,
      }
    });
    if (refreshedForecast) return refreshedForecast;
  }

  const scrapePromise = (async () => {
    return await runScrapeWithFallback(scrapeUrl, configRegionId);
  })();

  pendingScrapes.set(scrapeKey, scrapePromise);

  let scrapedForecasts;
  try {
    scrapedForecasts = await scrapePromise;
  } finally {
    pendingScrapes.delete(scrapeKey);
  }

  if (!scrapedForecasts || scrapedForecasts.length === 0) {
    throw new Error(`Scraper returned empty array for ${region.regionId}`);
  }

  console.log(
    `[getLatestConditions] 📊 Scraped ${scrapedForecasts.length} forecast(s), storing in database...`
  );

  // Store all scraped forecasts
  let requestedForecast = null;
  
  // Correctly handle daysLimit by filtering unique dates instead of record count
  let forecastsToStore = scrapedForecasts;
  if (daysLimit) {
    const dates = [...new Set(scrapedForecasts.map(f => f.date.toISOString().split('T')[0]))].slice(0, daysLimit);
    forecastsToStore = scrapedForecasts.filter(f => dates.includes(f.date.toISOString().split('T')[0]));
  }

  for (const scrapedForecast of forecastsToStore) {
    // Create a NEW date object to avoid mutating shared references
    const forecastDate = new Date(scrapedForecast.date);
    forecastDate.setUTCHours(0, 0, 0, 0);
    
    // 🚨 DATA INTEGRITY: If using regular forecast, skip days covered by Superforecast (offset)
    const dayDiff = Math.round((forecastDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (source === "WINDFINDER" && useRegularForecast && dayDiff < startDayOffset) {
      console.log(`[getLatestConditions] ⏭️ Skipping regular forecast upsert for ${forecastDate.toISOString().split('T')[0]} (offset: ${startDayOffset})`);
      continue;
    }

    const slot = (scrapedForecast as any).timeSlot || "MORNING";

    console.log(
      `[getLatestConditions] 💾 Upserting forecast for ${region.regionId} on ${forecastDate.toISOString().split("T")[0]} slot ${slot} - Tide: ${scrapedForecast.tide || 'MISSING'}`
    );
    
    const storedForecast = await prisma.forecast.upsert({
      where: {
        date_regionId_source_timeSlot: {
          date: forecastDate,
          regionId: region.regionId,
          source: source,
          timeSlot: slot as any,
        },
      },
      update: {
        windSpeed: scrapedForecast.windSpeed,
        windDirection: scrapedForecast.windDirection,
        swellHeight: scrapedForecast.swellHeight,
        swellPeriod: scrapedForecast.swellPeriod,
        swellDirection: scrapedForecast.swellDirection,
        trend: scrapedForecast.trend,
        tide: scrapedForecast.tide,
      },
      create: {
        id: randomUUID(),
        date: forecastDate,
        regionId: region.regionId,
        source: source,
        timeSlot: slot as any,
        windSpeed: scrapedForecast.windSpeed,
        windDirection: scrapedForecast.windDirection,
        swellHeight: scrapedForecast.swellHeight,
        swellPeriod: scrapedForecast.swellPeriod,
        swellDirection: scrapedForecast.swellDirection,
        trend: scrapedForecast.trend,
        tide: scrapedForecast.tide,
      },
    });

    // Match the exact record we need to return
    const isTargetDate = forecastDate.getTime() === lookupDate.getTime();
    const isTargetSlot = timeSlotParam ? storedForecast.timeSlot === timeSlotParam : storedForecast.timeSlot === activeSlot;

    if (isTargetDate && isTargetSlot) {
      requestedForecast = storedForecast;
    }
  }

  // Mass Score Calculation: Run score updates for ALL scraped slots 
  // This ensures that when the user toggles the UI, data is already ready.
  console.log(`[getLatestConditions] 📊 Batch calculating scores for ${scrapedForecasts.length} slots...`);
  for (const scrapedForecast of scrapedForecasts) {
    try {
      // Normalize date for score storage
      const forecastDate = new Date(scrapedForecast.date);
      forecastDate.setUTCHours(0, 0, 0, 0);

      await ScoreService.calculateAndStoreScores(region.regionId, {
        windSpeed: scrapedForecast.windSpeed,
        windDirection: scrapedForecast.windDirection,
        swellHeight: scrapedForecast.swellHeight,
        swellPeriod: scrapedForecast.swellPeriod,
        swellDirection: scrapedForecast.swellDirection,
        date: forecastDate,
        source: source,
        timeSlot: scrapedForecast.timeSlot,
      } as any);
    } catch (scoreErr) {
      console.error(`[getLatestConditions] ⚠️ Failed for slot ${scrapedForecast.timeSlot}:`, scoreErr);
    }
  }

  if (!requestedForecast) {
    console.log(`[getLatestConditions] ⚠️ Requested forecast (${lookupDate.toISOString().split('T')[0]} / ${timeSlotParam || activeSlot}) not found in scraped data.`);
    return null;
  }

  return requestedForecast;
}
