
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const dungeonsBeachId = "dungeons";
  const dunesBeachId = "dunes";

  console.log(`Checking and updating LogEntries for Dungeons and Dunes...`);

  const entries = await prisma.logEntry.findMany({
    where: {
      beachId: { in: [dungeonsBeachId, dunesBeachId] }
    }
  });

  console.log(`Found ${entries.length} entries for these beaches.`);

  for (const entry of entries) {
    const isDungeons = entry.beachId === dungeonsBeachId;
    const isDunes = entry.beachId === dunesBeachId;

    const data: any = {};
    let shouldUpdate = false;

    // Both should have "Tide Raider" as the logger
    if (entry.surferName !== "Tide Raider") {
      data.surferName = "Tide Raider";
      shouldUpdate = true;
    }

    // Dungeons entry specifically needs to be YOUTUBE for the shorts URL
    if (isDungeons && entry.videoPlatform !== "YOUTUBE") {
      data.videoPlatform = "YOUTUBE";
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      const updated = await prisma.logEntry.update({
        where: { id: entry.id },
        data: data
      });
      console.log(`Updated LogEntry ${entry.id} (${isDungeons ? 'Dungeons' : 'Dunes'}):`, data);
    } else {
      console.log(`LogEntry ${entry.id} (${isDungeons ? 'Dungeons' : 'Dunes'}) is already correct.`);
    }
  }

  await prisma.$disconnect();
}

main();
