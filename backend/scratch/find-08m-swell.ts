
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function find08mSwell() {
  const date = new Date("2026-05-08T00:00:00.000Z");
  
  const forecasts = await prisma.forecast.findMany({
    where: {
      date: date,
      swellHeight: 0.8
    }
  });

  console.log(`Found ${forecasts.length} forecasts with 0.8m swell on 2026-05-08:`);
  forecasts.forEach(f => {
    console.log(`- Region: ${f.regionId}, Source: ${f.source}, Slot: ${f.timeSlot}`);
  });

  await prisma.$disconnect();
}

find08mSwell().catch(console.error);
