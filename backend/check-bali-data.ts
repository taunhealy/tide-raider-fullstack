
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking Bali data...");

  // 1. Check Region
  const region = await prisma.region.findFirst({
    where: {
      OR: [
        { id: "bali" },
        { name: { contains: "Bali", mode: "insensitive" } }
      ]
    }
  });
  console.log("Region:", region);

  if (!region) {
    console.log("❌ Region 'bali' not found!");
    return;
  }

  // 2. Check Beaches
  const beaches = await prisma.beach.findMany({
    where: { regionId: region.id }
  });
  console.log(`Found ${beaches.length} beaches in ${region.id}`);

  // 3. Check Scores for today
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const scores = await prisma.beachDailyScore.findMany({
    where: {
      regionId: region.id,
      date: today
    }
  });
  console.log(`Found ${scores.length} scores for today (${today.toISOString()})`);

  // 4. Check Forecasts
  const forecasts = await prisma.forecast.findMany({
    where: {
      regionId: region.id,
      date: today
    }
  });
  console.log(`Found ${forecasts.length} forecasts for today`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
