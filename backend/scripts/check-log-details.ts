
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beaches = await prisma.beach.findMany({
    where: {
      name: { in: ["Dunes", "Dungeons 💀"] }
    }
  });

  const beachIds = beaches.map(b => b.id);
  
  const entries = await prisma.logEntry.findMany({
    where: {
      beachId: { in: beachIds }
    }
  });

  console.log(`LogEntries found for ${beaches.map(b => b.name).join(", ")}:`);
  console.log(JSON.stringify(entries.map(e => ({ id: e.id, beachName: e.beachName, surferName: e.surferName, videoPlatform: e.videoPlatform, videoUrl: e.videoUrl })), null, 2));

  await prisma.$disconnect();
}

main();
