
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkZARegion() {
  const region = await prisma.region.findFirst({
    where: {
      countryId: "za"
    },
    orderBy: {
      id: "asc"
    }
  });
  console.log(`First region for 'za': ${region?.id} (${region?.name})`);
  await prisma.$disconnect();
}

checkZARegion().catch(console.error);
