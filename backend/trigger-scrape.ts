
import { fetchAllRegionsData } from "./src/services/regionDataService";
import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Triggering scrape for all regions...");
  try {
    const results = await fetchAllRegionsData(7, ["western-cape"], true);
    console.log("Scrape results:", results);
  } catch (error) {
    console.error("Error triggering scrape:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
