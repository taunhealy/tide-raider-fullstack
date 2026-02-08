import { prisma } from "../lib/prisma";
import { getLatestConditions } from "./surfConditionsService";
import { ScoreService } from "./scoreService";
import { REGION_CONFIGS } from "../lib/scrapers/scrapeSources";

export async function fetchAllRegionsData(daysLimit?: number) {
  const results = {
    regionsProcessed: 0,
    regionsSucceeded: 0,
    regionsFailed: 0,
    errors: [] as string[],
    sourcesScraped: 0,
    sourcesFailed: 0,
  };

  try {
    // Get all regions from database
    const regions = await prisma.region.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`Found ${regions.length} regions to process`);

    // Process regions in parallel chunks to speed up execution
    // Cloud Run has a 5 min timeout, so we need to be efficient
    const CONCURRENCY = 1; // Process 1 region at a time to prevent memory overload
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
          
          for (const source of sourcesToScrape) {
            try {
              console.log(
                `  🔍 Fetching conditions for ${region.id} from ${source}...`
              );
              // forceRefresh = true means: always scrape to get fresh data for today
              const conditions = await getLatestConditions(
                region.id,
                true,
                source,
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
                  await ScoreService.calculateAndStoreScores(
                    region.id,
                    conditions
                  );
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
            } catch (error) {
              results.sourcesFailed++;
              console.error(
                `  ❌ Error fetching conditions from ${source} for ${region.id}:`,
                error
              );
            }
          }

          // Mark as succeeded if we got conditions from at least one source
          if (hasAnyConditions) {
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
    throw error;
  }
}
