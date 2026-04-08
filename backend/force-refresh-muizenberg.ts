
import { getLatestConditions } from './src/services/surfConditionsService';
import { prisma } from './src/lib/prisma';

async function main() {
  const regionId = "western-cape";
  const source = "WINDFINDER";
  
  console.log(`Starting forced refresh for ${regionId} (${source})...`);
  
  try {
    const result = await getLatestConditions(regionId, true, source);
    console.log("Success! New Forecast Data:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error during forced refresh:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
