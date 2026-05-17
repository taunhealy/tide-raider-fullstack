import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Checking DB for forecast rows...");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const forecasts = await prisma.forecast.findMany({
    where: {
      regionId: "western-cape",
      source: { in: ["WINDFINDER", "WINDFINDER_SUPER"] },
      date: { gte: today }
    },
    orderBy: [
      { date: "asc" },
      { timeSlot: "asc" },
      { source: "asc" }
    ]
  });

  console.log(`Found ${forecasts.length} rows.`);
  const grouped: Record<string, Record<string, any>> = {};

  for (const f of forecasts) {
    const key = `${f.date.toISOString().split("T")[0]}_${f.timeSlot}`;
    if (!grouped[key]) grouped[key] = {};
    grouped[key][f.source] = {
      wind: `${f.windSpeed}kts @ ${f.windDirection}°`,
      swell: `${f.swellHeight}m @ ${f.swellPeriod}s ${f.swellDirection}°`,
      updated: f.updatedAt.toISOString()
    };
  }

  console.log("\nComparison Table (Next 5 Days):");
  const keys = Object.keys(grouped).sort().slice(0, 15);
  for (const key of keys) {
    const sources = grouped[key];
    console.log(`\nDate/Slot: ${key}`);
    console.log("  WINDFINDER:      ", sources["WINDFINDER"] || "MISSING");
    console.log("  WINDFINDER_SUPER:", sources["WINDFINDER_SUPER"] || "MISSING");
  }
}

main().catch(console.error);
