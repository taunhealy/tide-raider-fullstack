import { prisma } from "../lib/prisma";
import { getLatestConditions } from "./surfConditionsService";
import { ScoreService } from "./scoreService";

export async function fetchAllRegionsData() {
  const results = {
    regionsProcessed: 0,
    regionsSucceeded: 0,
    regionsFailed: 0,
    errors: [] as string[],
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

        // Fetch latest conditions (this will scrape if needed)
        const conditions = await getLatestConditions(region.id, true);

        if (!conditions) {
          console.log(
            `No conditions found for region ${region.id}, skipping...`
          );
          results.regionsFailed++;
          results.errors.push(`No conditions for ${region.id}`);
          continue;
        }

        // Calculate and store scores for this region
        await ScoreService.calculateAndStoreScores(region.id, conditions);

        console.log(`✅ Successfully processed region ${region.id}`);
        results.regionsSucceeded++;
      } catch (error) {
        console.error(`❌ Error processing region ${region.id}:`, error);
        results.regionsFailed++;
        results.errors.push(
          `${region.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        // Continue with next region even if one fails
        continue;
      } finally {
        results.regionsProcessed++;
      }
    }

    return results;
  } catch (error) {
    console.error("Error in fetchAllRegionsData:", error);
    throw error;
  }
}
