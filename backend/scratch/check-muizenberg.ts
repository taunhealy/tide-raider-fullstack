
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkMuizenberg() {
  const beach = await prisma.beach.findFirst({
    where: {
      name: { contains: "Muizenberg", mode: "insensitive" }
    }
  });
  console.log("Muizenberg Data:", JSON.stringify(beach, null, 2));
  await prisma.$disconnect();
}

checkMuizenberg().catch(console.error);
