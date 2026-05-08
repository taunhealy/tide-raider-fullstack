
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listAllRegions() {
  const regions = await prisma.region.findMany({
    select: { id: true, name: true, countryId: true }
  });
  console.log(JSON.stringify(regions, null, 2));
  await prisma.$disconnect();
}

listAllRegions().catch(console.error);
