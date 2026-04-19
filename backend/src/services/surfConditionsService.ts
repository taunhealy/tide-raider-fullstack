import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";
import { REGION_CONFIGS } from "../lib/scrapers/scrapeSources";
import { scraperA } from "../lib/scrapers/scraperA";
import { scraperB } from "../lib/scrapers/scraperB";
import { ScoreService } from "./scoreService";
import { PythonBridge } from "../lib/pythonBridge";
import { BaseForecastData } from "../lib/types";

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
  timeSlotParam?: string
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
  if (source === "WINDFINDER") scrapeUrl = region.sourceA.url;
  else if (source === "WINDGURU") scrapeUrl = region.sourceB?.url || "";
  else if (source === "WINDY") scrapeUrl = region.sourceC?.url || "";

  if (!scrapeUrl) {
    throw new Error(`Scrape URL not configured for ${region.regionId} source ${source}`);
  }

  console.log(
    `[getLatestConditions] 🔄 Fetching fresh conditions for ${region.regionId} - Source: ${source} - URL: ${scrapeUrl}`
  );

  const runScrapeWithFallback = async (url: string, id: string) => {
    try {
      if (source === "WINDFINDER") return await scraperA(url, id);
      if (source === "WINDGURU") return await scraperB(url, id);
      return [];
    } catch (err) {
      console.error(`[getLatestConditions] ❌ Scrape failed for ${url}:`, err);
      try {
        console.log(`[getLatestConditions] 🧠 Attempting semantic scrape with Gemini...`);
        return await PythonBridge.runSemanticScrape(url, id) || [];
      } catch (semanticErr) {
        console.error(`[getLatestConditions] ❌ Semantic final fallback failed:`, semanticErr);
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
  
  const forecastsToStore = daysLimit 
    ? scrapedForecasts.slice(0, daysLimit)
    : scrapedForecasts;

  for (const scrapedForecast of forecastsToStore) {
    // Create a NEW date object to avoid mutating shared references
    const forecastDate = new Date(scrapedForecast.date);
    forecastDate.setUTCHours(0, 0, 0, 0);
    
    const slot = (scrapedForecast as any).timeSlot || "MORNING";

    console.log(
      `[getLatestConditions] 💾 Upserting forecast for ${region.regionId} on ${forecastDate.toISOString().split("T")[0]} slot ${slot}`
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
