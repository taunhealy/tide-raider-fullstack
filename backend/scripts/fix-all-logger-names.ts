
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
      beachId: { in: beachIds },
      OR: [
        { surferName: "Taun Healy" },
        { surferName: "Admin" }
      ]
    }
  });

  console.log(`Found ${entries.length} entries for ${beaches.map(b => b.name).join(", ")} that need updating...`);

  if (entries.length > 0) {
    const updated = await prisma.logEntry.updateMany({
      where: {
        id: { in: entries.map(e => e.id) }
      },
      data: {
        surferName: "Tide Raider"
      }
    });
    console.log(`Successfully updated ${updated.count} entries to 'Tide Raider'.`);
  } else {
    console.log("No matching entries found to update.");
  }

  await prisma.$disconnect();
}

main();
