/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking specific beaches for isHiddenGem field...\n");

  // Check Dungeons
  const dungeons = await prisma.beach.findUnique({
    where: { id: "dungeons" },
    select: {
      id: true,
      name: true,
      isHiddenGem: true,
    },
  });

  console.log("Dungeons beach:");
  console.log(JSON.stringify(dungeons, null, 2));

  // Check Hout Bay Harbour Wedge
  const houtBay = await prisma.beach.findUnique({
    where: { id: "hout-bay-harbour-wedge" },
    select: {
      id: true,
      name: true,
      isHiddenGem: true,
    },
  });

  console.log("\nHout Bay Harbour Wedge:");
  console.log(JSON.stringify(houtBay, null, 2));

  // Count all beaches with isHiddenGem = true
  const count = await prisma.beach.count({
    where: {
      isHiddenGem: true,
    },
  });

  console.log(`\n📊 Total beaches with isHiddenGem=true: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
