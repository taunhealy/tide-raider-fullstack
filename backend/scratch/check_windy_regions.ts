
import { prisma } from "../src/lib/prisma";

async function check() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const windyForecasts = await prisma.forecast.findMany({
    where: { source: "WINDY", date: today },
    select: { regionId: true }
  });
  console.log("WINDY regions with data today:", windyForecasts.map(f => f.regionId));
}

check().catch(console.error).finally(() => prisma.$disconnect());
