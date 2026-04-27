import { fetchAllRegionsData } from '../services/regionDataService';

async function main() {
  console.log("Triggering fresh scrape for western-cape...");
  await fetchAllRegionsData(7, ['western-cape']);
  console.log("Scrape complete.");
}

main().catch(console.error);
