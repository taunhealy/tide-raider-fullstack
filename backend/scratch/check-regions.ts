
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkRegions() {
  const regions = await prisma.region.findMany();
  console.log(`Regions:`);
  regions.forEach(r => {
    console.log(`- ID: ${r.id}, Name: ${r.name}`);
  });

  const forecastsZA = await prisma.forecast.findMany({
    where: {
      regionId: "za",
      date: new Date("2026-05-08T00:00:00.000Z")
    }
  });
  console.log(`\nForecasts for 'za': ${forecastsZA.length}`);
  forecastsZA.forEach(f => {
    console.log(`- Source: ${f.source}, Swell: ${f.swellHeight}m`);
  });

  await prisma.$disconnect();
}

checkRegions().catch(console.error);
