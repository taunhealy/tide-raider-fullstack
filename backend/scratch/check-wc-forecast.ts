import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const forecasts = await prisma.forecast.findMany({
    where: {
      regionId: "western-cape",
      source: "WINDFINDER",
    },
    orderBy: { date: "desc" },
    take: 10,
  });

  if (forecasts.length === 0) {
    console.log("❌ No WINDFINDER forecasts found for western-cape");
    return;
  }

  console.log(`✅ Found ${forecasts.length} forecast(s):\n`);
  forecasts.forEach((f) => {
    console.log(
      `  ${f.date.toISOString().split("T")[0]}  wind: ${f.windSpeed}kts ${f.windDirection}°  swell: ${f.swellHeight}m @ ${f.swellPeriod}s ${f.swellDirection}°`
    );
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
