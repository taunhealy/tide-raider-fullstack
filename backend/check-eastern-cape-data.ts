
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking Eastern Cape data...");

  // Check if region exists
  const region1 = await prisma.region.findUnique({ where: { id: "eastern-cape" } });
  console.log("Region 'eastern-cape':", region1);

  const region2 = await prisma.region.findUnique({ where: { id: "Eastern Cape" } });
  console.log("Region 'Eastern Cape':", region2);

  // Check forecasts
  const forecasts1 = await prisma.forecast.findMany({
    where: { regionId: "eastern-cape" },
    take: 5,
    orderBy: { date: "desc" },
  });
  console.log("Forecasts for 'eastern-cape':", forecasts1.length);
  if (forecasts1.length > 0) console.log(forecasts1[0]);

  const forecasts2 = await prisma.forecast.findMany({
    where: { regionId: "Eastern Cape" },
    take: 5,
    orderBy: { date: "desc" },
  });
  console.log("Forecasts for 'Eastern Cape':", forecasts2.length);
  if (forecasts2.length > 0) console.log(forecasts2[0]);

  // Check by name
  const regionsByName = await prisma.region.findMany({
    where: { name: { contains: "Eastern Cape", mode: "insensitive" } },
  });
  console.log("Regions by name 'Eastern Cape':", regionsByName);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
