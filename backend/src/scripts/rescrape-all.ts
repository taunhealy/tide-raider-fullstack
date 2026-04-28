
import { fetchAllRegionsData } from '../services/regionDataService';

async function main() {
  console.log("🚀 Starting comprehensive rescrape for all regions (upcoming 10 days)...");
  // Passing 10 days to get upcoming weeks (limited by source capabilities)
  // Passing empty array for regionIds to process all regions
  const results = await fetchAllRegionsData(10, []);
  console.log("✅ Comprehensive rescrape complete.");
  console.log("Summary:", JSON.stringify(results, null, 2));
}

main().catch(console.error);
