// @ts-nocheck
import { prisma } from "../lib/prisma";
import { REGION_CONFIGS } from "../lib/scrapers/scrapeSources";
import { BaseForecastData } from "../lib/types";
import { ScoreService } from "./scoreService";
import { randomUUID } from "crypto";
import { fetchArchiveFromOpenMeteo } from "../lib/scrapers/openmeteo";
import { scraperA } from "../lib/scrapers/scraperA";
import { appendFileSync } from 'fs';
import { join } from 'path';

const pendingScrapes = new Map<string, Promise<any>>();

function debugLog(msg: string) {
  const logPath = join(process.cwd(), 'scratch', 'debug_log.txt');
  appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
}

function getTodayDate() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function getLatestConditions(
  regionId: string,
  forceRefresh = false,
  source: "WINDFINDER" | "WINDFINDER_SUPER" | "WINDGURU" | "WINDY" | "OPENMETEO_ARCHIVE" = "WINDFINDER",
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
        source: source as any,
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

  // If looking for a past date, we MUST use archive (scrapers only work for future/current)
  const today = getTodayDate();
  if (lookupDate < today) {
      // Check if it exists in DB first under OPENMETEO_ARCHIVE source
      const archiveInDb = await prisma.forecast.findFirst({
          where: {
              regionId: region.regionId,
              source: "OPENMETEO_ARCHIVE",
              date: lookupDate,
              timeSlot: (timeSlotParam as any) || activeSlot,
          }
      });

      if (archiveInDb && !forceRefresh) {
          console.log(`[getLatestConditions] 📦 Using cached ARCHIVE for ${region.regionId} on ${lookupDate.toISOString().split("T")[0]}`);
          return archiveInDb;
      }

      console.log(`[getLatestConditions] 🕒 Past date detected (${lookupDate.toISOString().split('T')[0]}). Triggering Archive Fetch...`);
      const archiveForecasts = await fetchArchiveFromOpenMeteo(region.regionId, lookupDate);
      
      if (archiveForecasts.length > 0) {
          // Parallelize storage and score calculation
          const results = await Promise.all(archiveForecasts.map(async (f) => {
              const stored = await prisma.forecast.upsert({
                  where: {
                      date_regionId_source_timeSlot: {
                          date: lookupDate,
                          regionId: region.regionId,
                          source: "OPENMETEO_ARCHIVE",
                          timeSlot: f.timeSlot
                      }
                  },
                  update: {
                      ...f,
                      source: "OPENMETEO_ARCHIVE"
                  },
                  create: {
                      id: randomUUID(),
                      ...f,
                      source: "OPENMETEO_ARCHIVE",
                      regionId: region.regionId
                  }
              });

              // Calculate scores
              await ScoreService.calculateAndStoreScores(region.regionId, {
                  ...f,
                  source: "OPENMETEO_ARCHIVE",
                  regionId: region.regionId
              } as any);

              return stored;
          }));

          // Return the specific requested slot
          const targetSlot = timeSlotParam || activeSlot;
          const requestedArchive = results.find(r => r.timeSlot === targetSlot) || results[0];
          
          console.log(`[getLatestConditions] ✅ Archive retrieval complete. Returning slot: ${requestedArchive.timeSlot}`);
          return requestedArchive;
      } else {
          console.error(`[getLatestConditions] ❌ Archive fetch returned no data for ${region.regionId} on ${lookupDate.toISOString()}`);
          // Fall through to scrapers (which will likely fail) or throw
      }
  }

  // Determine URL based on source
  let scrapeUrl = "";
  const diffDays = Math.round((lookupDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Explicitly handle the two Windfinder sources
  if (source === "WINDFINDER_SUPER") {
    scrapeUrl = region.sourceA.url; // Superforecast URL
  } else if (source === "WINDFINDER") {
    // If we have a dedicated regular forecast URL, use it for Alpha (especially beyond day 3)
    scrapeUrl = region.sourceA.forecastUrl || region.sourceA.url;
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
      if (source === "WINDFINDER" || source === "WINDFINDER_SUPER") {
        try {
          return await scraperA(currentUrl, id);
        } catch (err) {
          console.error(`[getLatestConditions] ❌ Scrape failed for ${url}:`, err);
          
          // USER REQUEST: Send email on failure instead of using Crawl4ai
          try {
            const { sendEmail } = await import("../lib/email");
            const errorMessage = err instanceof Error ? err.message : String(err);
            const stack = err instanceof Error ? err.stack : "No stack trace";
            
            const html = `
              <h2>🚨 Scraper Failure Alert</h2>
              <p><strong>Source:</strong> ${source}</p>
              <p><strong>Region:</strong> ${id}</p>
              <p><strong>URL:</strong> <a href="${url}">${url}</a></p>
              <p><strong>Error:</strong> ${errorMessage}</p>
              <hr>
              <pre style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 12px;">${stack}</pre>
            `;
            
            await sendEmail("taunhealy@gmail.com", `🚨 Scraper Failure: ${source} - ${id}`, html);
            console.log(`[getLatestConditions] 📧 Failure alert sent to taunhealy@gmail.com`);
          } catch (emailErr) {
            console.error(`[getLatestConditions] 📧 Failed to send email alert:`, emailErr);
          }
          throw err;
        }
      } else if (source === "WINDGURU") {
        const { scraperB } = await import("../lib/scrapers/scraperB");
        return await scraperB(currentUrl, id);
      } else if (source === "WINDY") {
        const { scraperC } = await import("../lib/scrapers/scraperC");
        return await scraperC(currentUrl, id);
      }
    } catch (err) {
      console.error(`[getLatestConditions] ❌ All scrape attempts failed for ${id}:`, err);
      return null;
    }
  };

  const scrapeKey = `${region.regionId}_${source}`;
  if (pendingScrapes.has(scrapeKey)) {
    console.log(`[getLatestConditions] ⏳ Scrape already in progress for ${scrapeKey}, waiting for promise...`);
    await pendingScrapes.get(scrapeKey);
    
    // After waiting, check DB again
    const refreshedForecast = await prisma.forecast.findFirst({
      where: {
        date: lookupDate,
        regionId: region.regionId,
        source: source as any,
        timeSlot: (timeSlotParam as any) || activeSlot,
      }
    });
    if (refreshedForecast) return refreshedForecast;
  }

  const scrapePromise = (async () => {
    return await runScrapeWithFallback(scrapeUrl, configRegionId);
  })();

  pendingScrapes.set(scrapeKey, scrapePromise);

  let scrapedForecasts: BaseForecastData[] = [];
  let isActuallyRegular = false;
  let isSuperforecast = scrapeUrl.includes('weatherforecast') || source === "WINDFINDER_SUPER";

  try {
    const rawResult = await scrapePromise;
    debugLog(`Raw scraper result type: ${typeof rawResult}, isArray: ${Array.isArray(rawResult)}, keys: ${rawResult && typeof rawResult === 'object' ? Object.keys(rawResult).join(',') : 'none'}`);
    
    if ((source === "WINDFINDER" || source === "WINDFINDER_SUPER") && rawResult && typeof rawResult === 'object' && 'forecasts' in rawResult) {
      const windfinderResult = rawResult as unknown as { forecasts: BaseForecastData[], isSuperforecast: boolean };
      scrapedForecasts = windfinderResult.forecasts;
      debugLog(`Scraped forecasts length: ${scrapedForecasts?.length || 0}`);
      isActuallyRegular = !windfinderResult.isSuperforecast;

      // 🚨 TACTICAL ALERT: If we wanted Superforecast but got Regular (Fallback)
      const useRegularForecast = source === "WINDFINDER";
      if (!useRegularForecast && isActuallyRegular) {
        console.log(`[getLatestConditions] ⚠️ Superforecast Fallback detected for ${region.regionId}. Sending alert...`);
        const { sendEmail } = await import("../lib/email");
        const html = `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #f59e0b; border-radius: 10px;">
            <h2 style="color: #d97706;">⚠️ Superforecast Fallback Alert</h2>
            <p><strong>Region:</strong> ${region.regionId}</p>
            <p><strong>Status:</strong> The Superforecast URL failed to load or parse, and the system automatically fell back to the Regular forecast.</p>
            <p><strong>Impact:</strong> Today's data for this region is using lower-precision forecast data.</p>
            <hr/>
            <p style="font-size: 12px; color: #666;">This is an automated tactical alert from Tide Raider Backend.</p>
          </div>
        `;
        sendEmail("admin@tideraider.com", `⚠️ Superforecast Fallback: ${region.regionId}`, html).catch(e => console.error("Failed to send fallback alert:", e));
      }
    } else {
      scrapedForecasts = Array.isArray(rawResult) ? rawResult : [];
    }
  } finally {
    pendingScrapes.delete(scrapeKey);
  }

  if (!scrapedForecasts || scrapedForecasts.length === 0) {
    throw new Error(`Scraper returned empty array for ${region.regionId}`);
  }

  console.log(
    `[getLatestConditions] 📊 Scraped ${scrapedForecasts.length} forecast(s), storing in database... (Actually Regular: ${isActuallyRegular}, isSuperforecast: ${isSuperforecast})`
  );

  // Store all scraped forecasts
  let requestedForecast = null;
  
  try {
    // Correctly handle daysLimit and startDayOffset by filtering unique dates
    let forecastsToStore = scrapedForecasts;

    // Filter out dates before startDayOffset if provided
    if (startDayOffset > 0) {
      const today = getTodayDate();
      const cutoffDate = new Date(today.getTime() + startDayOffset * 24 * 60 * 60 * 1000);
      cutoffDate.setUTCHours(0, 0, 0, 0);
      forecastsToStore = forecastsToStore.filter(f => {
        const fDate = new Date(f.date);
        fDate.setUTCHours(0, 0, 0, 0);
        return fDate >= cutoffDate;
      });
      console.log(`[getLatestConditions] ✂️ Applied startDayOffset: ${startDayOffset}. Filtered ${scrapedForecasts.length} down to ${forecastsToStore.length} forecasts.`);
    }

    if (daysLimit) {
      const uniqueDates = [...new Set(forecastsToStore.map(f => {
        const d = new Date(f.date);
        d.setUTCHours(0, 0, 0, 0);
        return d.toISOString().split('T')[0];
      }))].slice(0, daysLimit);
      forecastsToStore = forecastsToStore.filter(f => {
        const d = new Date(f.date);
        d.setUTCHours(0, 0, 0, 0);
        return uniqueDates.includes(d.toISOString().split('T')[0]);
      });
    }
    debugLog(`Forecasts to store length: ${forecastsToStore?.length || 0}`);

    for (const scrapedForecast of forecastsToStore) {
      // Create a NEW date object to avoid mutating shared references
      const forecastDate = new Date(scrapedForecast.date);
      forecastDate.setUTCHours(0, 0, 0, 0);
      
      const slot = (scrapedForecast as any).timeSlot || "MORNING";
      const isActuallySuper = isSuperforecast && !isActuallyRegular;
      const effectiveSource = (source === "WINDFINDER" || source === "WINDFINDER_SUPER") 
        ? (isActuallySuper ? "WINDFINDER_SUPER" : "WINDFINDER") 
        : source;

      debugLog(`Upserting forecast for ${region.regionId} on ${forecastDate.toISOString().split("T")[0]} slot ${slot} - Source: ${effectiveSource} (Original source: ${source})`);
      
      const storedForecast = await prisma.forecast.upsert({
        where: {
          date_regionId_source_timeSlot: {
            date: forecastDate,
            regionId: region.regionId,
            source: effectiveSource as any,
            timeSlot: slot as any,
          },
        },
        update: {
          windSpeed: scrapedForecast.windSpeed,
          windDirection: scrapedForecast.windDirection,
          swellHeight: scrapedForecast.swellHeight,
          swellPeriod: scrapedForecast.swellPeriod,
          swellDirection: scrapedForecast.swellDirection,
          swellHeight2: scrapedForecast.swellHeight2 || 0,
          swellPeriod2: scrapedForecast.swellPeriod2 || 0,
          swellDirection2: scrapedForecast.swellDirection2 || 0,
          swellHeight3: scrapedForecast.swellHeight3 || 0,
          swellPeriod3: scrapedForecast.swellPeriod3 || 0,
          swellDirection3: scrapedForecast.swellDirection3 || 0,
          swellEnergy: scrapedForecast.swellEnergy || 0,
          trend: scrapedForecast.trend,
          tide: scrapedForecast.tide,
        },
        create: {
          id: randomUUID(),
          date: forecastDate,
          regionId: region.regionId,
          source: effectiveSource as any,
          timeSlot: slot as any,
          windSpeed: scrapedForecast.windSpeed,
          windDirection: scrapedForecast.windDirection,
          swellHeight: scrapedForecast.swellHeight,
          swellPeriod: scrapedForecast.swellPeriod,
          swellDirection: scrapedForecast.swellDirection,
          swellHeight2: scrapedForecast.swellHeight2 || 0,
          swellPeriod2: scrapedForecast.swellPeriod2 || 0,
          swellDirection2: scrapedForecast.swellDirection2 || 0,
          swellHeight3: scrapedForecast.swellHeight3 || 0,
          swellPeriod3: scrapedForecast.swellPeriod3 || 0,
          swellDirection3: scrapedForecast.swellDirection3 || 0,
          swellEnergy: scrapedForecast.swellEnergy || 0,
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
    console.log(`[getLatestConditions] 📊 Batch calculating scores for ${forecastsToStore.length} slots...`);
    for (const scrapedForecast of forecastsToStore) {
      try {
        const forecastDate = new Date(scrapedForecast.date);
        forecastDate.setUTCHours(0, 0, 0, 0);

        const isActuallySuper = isSuperforecast && !isActuallyRegular;
        const effectiveSource = (source === "WINDFINDER" || source === "WINDFINDER_SUPER") 
          ? (isActuallySuper ? "WINDFINDER_SUPER" : "WINDFINDER") 
          : source;

        await ScoreService.calculateAndStoreScores(region.regionId, {
          windSpeed: scrapedForecast.windSpeed,
          windDirection: scrapedForecast.windDirection,
          swellHeight: scrapedForecast.swellHeight,
          swellPeriod: scrapedForecast.swellPeriod,
          swellDirection: scrapedForecast.swellDirection,
          date: forecastDate,
          source: effectiveSource,
          timeSlot: scrapedForecast.timeSlot,
        } as any);
      } catch (scoreErr) {
        console.error(`[getLatestConditions] ⚠️ Failed for slot ${scrapedForecast.timeSlot}:`, scoreErr);
      }
    }
  } catch (err) {
    debugLog(`ERROR in storage loop: ${err.message}`);
    console.error("Storage loop error:", err);
  }

  if (!requestedForecast) {
    console.log(`[getLatestConditions] ⚠️ Requested forecast (${lookupDate.toISOString().split('T')[0]} / ${timeSlotParam || activeSlot}) not found in scraped data.`);
    return null;
  }

  return requestedForecast;
}
