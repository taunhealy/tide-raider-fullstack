import { prisma } from "../lib/prisma";
import { getLatestConditions } from "./surfConditionsService";
import { ScoreService } from "./scoreService";
import { REGION_CONFIGS } from "../lib/scrapers/scrapeSources";
import { EnsembleService } from "./ensembleService";
import { TimeSlot } from "@prisma/client";

// Core South Africa regions that are always kept fresh by cron
const CORE_REGIONS = ["western-cape", "eastern-cape"];
const STALE_THRESHOLD_MS = 1000 * 60 * 60 * 6; // 6 hours

export async function fetchAllRegionsData(daysLimit?: number, regionIds?: string[], forceRefresh: boolean = false) {
  const results = {
    regionsProcessed: 0,
    regionsSucceeded: 0,
    regionsFailed: 0,
    errors: [] as string[],
    sourcesScraped: 0,
    sourcesFailed: 0,
  };

  try {
    // Get all regions from database or target specific ones
    // We now default to CORE_REGIONS if none are specified to prevent server overload
    const targetIds = regionIds && regionIds.length > 0 ? regionIds : CORE_REGIONS;
    
    const regions = await prisma.region.findMany({
      where: { id: { in: targetIds } },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`Found ${regions.length} regions to process`);

    // Process regions in parallel chunks to speed up execution
    // Cloud Run has a 5 min timeout, so we need to be efficient
    const CONCURRENCY = 2; // Process 2 regions at a time (reduced from 5 to prevent OOM/CPU timeouts)
    const chunks = [];
    
    for (let i = 0; i < regions.length; i += CONCURRENCY) {
      chunks.push(regions.slice(i, i + CONCURRENCY));
    }

    console.log(`Processing ${regions.length} regions in ${chunks.length} chunks (concurrency: ${CONCURRENCY})`);

    for (const chunk of chunks) {
      // Process chunk in parallel
      const chunkPromises = chunk.map(async (region) => {
        try {
          console.log(`Processing region: ${region.name} (${region.id})`);

          // Find region config to determine which sources are available
          let regionConfig = REGION_CONFIGS[region.id];

          // If not found by ID, try slug format variations
          if (!regionConfig) {
            const slugVariations = [
              region.id.toLowerCase(),
              region.id.replace(/\s+/g, "-").toLowerCase(),
              region.name.toLowerCase().replace(/\s+/g, "-"),
            ];

            for (const slug of slugVariations) {
              if (REGION_CONFIGS[slug]) {
                regionConfig = REGION_CONFIGS[slug];
                break;
              }
            }
          }

          // Determine which sources to scrape based on what's configured
          const sourcesToScrape: Array<"WINDFINDER" | "WINDGURU" | "WINDY"> = [];
          if (regionConfig?.sourceA) sourcesToScrape.push("WINDFINDER");
          if (regionConfig?.sourceB) sourcesToScrape.push("WINDGURU");
          if (regionConfig?.sourceC) sourcesToScrape.push("WINDY");

          if (sourcesToScrape.length === 0) {
            console.log(
              `⚠️ No sources configured for region ${region.id}, skipping...`
            );
            results.regionsFailed++;
            results.errors.push(`No sources configured for ${region.id}`);
            results.regionsProcessed++;
            return;
          }

          console.log(
            `📊 Scraping ${sourcesToScrape.length} source(s) for ${region.id}: ${sourcesToScrape.join(", ")}`
          );

          // Scrape all available sources for this region
          let hasAnyConditions = false;
          const SUPERFORECAST_LIMIT_DAYS = 3;
          
          for (const source of sourcesToScrape) {
            try {
              // Freshness Check: When was the last time we synced this source for this region?
              // We use updatedAt because createdAt stays the same on upserts.
              const latestForecast = await prisma.forecast.findFirst({
                where: { regionId: region.id, source: source },
                orderBy: { updatedAt: 'desc' }
              });

              // Also check if we actually HAVE data for today. 
              // If we have "fresh" data but it doesn't include today, we still need to scrape.
              const today = new Date();
              today.setUTCHours(0, 0, 0, 0);
              const hasToday = await prisma.forecast.findFirst({
                where: { regionId: region.id, source: source, date: today }
              });

              const isStale = !latestForecast || (Date.now() - new Date(latestForecast.updatedAt).getTime() > STALE_THRESHOLD_MS);

              if (!isStale && hasToday && !forceRefresh) {
                console.log(`  ✅ Data for ${region.id} from ${source} is still fresh (updated ${Math.round((Date.now() - new Date(latestForecast!.updatedAt).getTime()) / 60000)}m ago). Skipping scrape.`);
                results.sourcesScraped++; 
                hasAnyConditions = true;
                continue;
              }

              console.log(
                `  🔍 Fetching fresh conditions for ${region.id} from ${source}...`
              );
              // forceRefresh in getLatestConditions means "ignore DB cache for the requested slot"
              // For WINDFINDER, we specifically want to request SUPER if it's the main sync
              const requestedSource = source === "WINDFINDER" ? "WINDFINDER_SUPER" : source;
              
              const conditions = await getLatestConditions(
                region.id,
                true, // We still pass true here because we already decided to scrape
                requestedSource as any,
                daysLimit // Pass the limit here
              );

              if (conditions) {
                hasAnyConditions = true;
                results.sourcesScraped++;
                console.log(
                  `  ✅ Successfully fetched conditions from ${source} for ${region.id}`
                );

                // Calculate and store scores for this specific source
                try {
                  const forecasts = Array.isArray(conditions) ? conditions : [conditions];
                  for (const forecast of forecasts) {
                    await ScoreService.calculateAndStoreScores(
                      region.id,
                      forecast
                    );
                  }
                  console.log(
                    `  ✅ Calculated scores for ${source} in ${region.id}`
                  );
                } catch (error) {
                  console.error(
                    `  ❌ Error calculating scores for ${source} in ${region.id}:`,
                    error
                  );
                }
              } else {
                results.sourcesFailed++;
                console.log(
                  `  ⚠️ No conditions found from ${source} for ${region.id}`
                );
              }

              // For WINDFINDER: if the daysLimit exceeds the Superforecast window (3d),
              // also scrape the regular Windfinder forecast URL to populate days 4-10.
              if (
                source === "WINDFINDER" &&
                (daysLimit === undefined || daysLimit > SUPERFORECAST_LIMIT_DAYS)
              ) {
                const config = REGION_CONFIGS[region.id];
                if (config?.sourceA?.forecastUrl) {
                  try {
                    console.log(`  🔍 Fetching extended forecast (days 4-10) for ${region.id} from Windfinder Regular...`);
                    const extendedConditions = await getLatestConditions(
                      region.id,
                      true,
                      source,
                      daysLimit,
                      // Pass a target date 4 days out so surfConditionsService selects the regular URL
                      new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
                      undefined,
                      SUPERFORECAST_LIMIT_DAYS // startDayOffset: ensure we capture from Day 3 onwards
                    );
                    if (extendedConditions) {
                      console.log(`  ✅ Extended Windfinder forecast fetched for ${region.id}`);
                    }
                  } catch (extError) {
                    console.warn(`  ⚠️ Extended Windfinder scrape skipped for ${region.id}:`, extError);
                  }
                }
              }
            } catch (error) {
              results.sourcesFailed++;
              console.error(
                `  ❌ Error fetching conditions from ${source} for ${region.id}:`,
                error
              );
            }
          }

          // Trigger Ensemble Calculation (Tide Raider Source)
          if (hasAnyConditions) {
            console.log(`🌊 [Ensemble] Triggering Tide Raider ensemble update for ${region.id}...`);
            const timeSlots: TimeSlot[] = ["MORNING", "NOON"];
            const daysToEnsemble = daysLimit || 10;
            
            for (let i = 0; i < daysToEnsemble; i++) {
              const ensembleDate = new Date();
              ensembleDate.setDate(ensembleDate.getDate() + i);
              ensembleDate.setUTCHours(0, 0, 0, 0);

              for (const slot of timeSlots) {
                EnsembleService.updateEnsembleForecast(region.id, ensembleDate, slot).catch(err => {
                  console.error(`❌ [Ensemble] Error for ${region.id} on ${ensembleDate.toISOString()} (${slot}):`, err);
                });
              }
            }
            
            console.log(`✅ Successfully processed region ${region.id}`);
            results.regionsSucceeded++;
          } else {
            console.log(
              `⚠️ No conditions found for any source for region ${region.id}`
            );
            results.regionsFailed++;
            results.errors.push(`No conditions for ${region.id}`);
          }
        } catch (error) {
          console.error(`❌ Error processing region ${region.id}:`, error);
          results.regionsFailed++;
          results.errors.push(
            `${region.id}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        } finally {
          results.regionsProcessed++;
        }
      });

      // Wait for current chunk to complete before starting next one
      await Promise.all(chunkPromises);
    }

    console.log(`📊 Scraping summary:`, {
      sourcesScraped: results.sourcesScraped,
      sourcesFailed: results.sourcesFailed,
      totalSourcesAttempted: results.sourcesScraped + results.sourcesFailed,
    });

    return results;
  } catch (error) {
    console.error("Error in fetchAllRegionsData:", error);
  }
}

/**
 * Ensures data for a specific region is fresh.
 * If data is missing or older than STALE_THRESHOLD, it triggers a background scrape.
 */
export async function ensureRegionDataFresh(regionId: string) {
  // If it's a core region, we assume cron is handling it
  if (CORE_REGIONS.includes(regionId)) return;

  try {
    // 1. Check most recent forecast for this region
    const latestForecast = await prisma.forecast.findFirst({
      where: { regionId: regionId },
      orderBy: { updatedAt: 'desc' }
    });

    const isStale = !latestForecast || (Date.now() - new Date(latestForecast.updatedAt).getTime() > STALE_THRESHOLD_MS);

    if (isStale) {
      console.log(`📡 [Pulse] Region ${regionId} is stale or missing. Triggering background scrape...`);
      // Start background scrape - we don't 'await' it to avoid blocking the user request
      fetchAllRegionsData(3, [regionId]).catch(err => {
        console.error(`❌ [Pulse] Background scrape failed for ${regionId}:`, err);
      });
      return { status: "fetching", message: "Synchronizing satellite data..." };
    }

    return { status: "fresh" };
  } catch (err) {
    console.error(`❌ [Pulse] Failed to verify freshness for ${regionId}:`, err);
    return { status: "error" };
  }
}
