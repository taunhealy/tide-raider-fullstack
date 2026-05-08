
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkLlandudnoBeach() {
  const beach = await prisma.beach.findFirst({
    where: { name: { contains: "Llandudno", mode: "insensitive" } }
  });
  console.log("Llandudno Beach Entry:", JSON.stringify(beach, null, 2));
  await prisma.$disconnect();
}

checkLlandudnoBeach().catch(console.error);
