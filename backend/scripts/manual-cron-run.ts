
import { getCronScheduler } from "../src/services/cronScheduler";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🚀 Starting manual cron run...");
  const start = Date.now();
  
  try {
    const scheduler = getCronScheduler();
    const result = await scheduler.runNow();
    
    console.log("✅ Cron run completed successfully!");
    console.log("Duration:", result.duration);
    console.log("Region Results:", JSON.stringify(result.regionResults, null, 2));
    console.log("Alert Results:", JSON.stringify(result.alertResults, null, 2));
  } catch (error) {
    console.error("❌ Cron run failed:", error);
  } finally {
    const totalDuration = Date.now() - start;
    console.log(`\nTotal script execution time: ${totalDuration}ms`);
    await prisma.$disconnect();
  }
}

main();
