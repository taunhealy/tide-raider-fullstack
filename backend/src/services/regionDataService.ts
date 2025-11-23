import { prisma } from "../lib/prisma";
import { getLatestConditions } from "./surfConditionsService";
import { ScoreService } from "./scoreService";
import { REGION_CONFIGS } from "../lib/scrapers/scrapeSources";

export async function fetchAllRegionsData() {
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

    // Process each region sequentially to avoid overwhelming the database
    for (const region of regions) {
      try {
        console.log(`Processing region: ${region.name} (${region.id})`);

        // Find region config to determine which sources are available
        let regionConfig = REGION_CONFIGS[region.id];

        // If not found by ID, try slug format variations (same logic as in surfConditionsService)
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
          continue;
        }

        console.log(
          `📊 Scraping ${sourcesToScrape.length} source(s) for ${region.id}: ${sourcesToScrape.join(", ")}`
        );

        // Scrape all available sources for this region
        let hasAnyConditions = false;
        let lastSuccessfulConditions = null;

        for (const source of sourcesToScrape) {
          try {
            console.log(
              `  🔍 Fetching conditions for ${region.id} from ${source}...`
            );
            // forceRefresh = false means: check DB first, only scrape if no data for today
            const conditions = await getLatestConditions(
              region.id,
              false,
              source
            );

            if (conditions) {
              hasAnyConditions = true;
              lastSuccessfulConditions = conditions;
              results.sourcesScraped++;
              console.log(
                `  ✅ Successfully fetched conditions from ${source} for ${region.id}`
              );
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
            // Continue with next source even if one fails
          }
        }

        // Calculate and store scores using the last successful conditions
        // (or any available conditions - scores are source-agnostic)
        if (hasAnyConditions && lastSuccessfulConditions) {
          try {
            await ScoreService.calculateAndStoreScores(
              region.id,
              lastSuccessfulConditions
            );
            console.log(`✅ Successfully processed region ${region.id}`);
            results.regionsSucceeded++;
          } catch (error) {
            console.error(
              `❌ Error calculating scores for region ${region.id}:`,
              error
            );
            // Still count as succeeded if we got conditions, even if score calculation failed
            results.regionsSucceeded++;
          }
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
        // Continue with next region even if one fails
      } finally {
        results.regionsProcessed++;
      }
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
