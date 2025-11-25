/**
 * Manually trigger cron job to scrape all regions
 * Run: npx tsx trigger-cron.ts
 */

async function triggerCron() {
  const BACKEND_URL = process.env.BACKEND_URL || "https://tide-raider-backend-o6rx5gs5rq-ew.a.run.app";
  const CRON_SECRET = process.env.CRON_SECRET;

  if (!CRON_SECRET) {
    console.error("❌ CRON_SECRET environment variable not set");
    console.log("\nSet it in your .env file or run:");
    console.log("$env:CRON_SECRET='your-secret'; npx tsx trigger-cron.ts");
    process.exit(1);
  }

  console.log(`🔧 Triggering cron job at ${BACKEND_URL}/api/cron/run-now`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

  try {
    const response = await fetch(`${BACKEND_URL}/api/cron/run-now`, {
      method: "POST",
      headers: {
        "x-cron-secret": CRON_SECRET,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log("\n✅ Cron job triggered successfully!");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("\n❌ Failed to trigger cron:", error);
    process.exit(1);
  }
}

triggerCron();
