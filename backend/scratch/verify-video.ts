
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beach = await prisma.beach.findUnique({
    where: { id: "kalk-bay-reef" },
    select: { id: true, name: true, videos: true }
  });

  if (beach) {
    console.log(`Beach: ${beach.name}`);
    console.log(`Videos: ${JSON.stringify(beach.videos, null, 2)}`);
  } else {
    console.log("Beach not found");
  }

  await prisma.$disconnect();
}

main();
