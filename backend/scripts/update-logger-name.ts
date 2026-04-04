
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ids = [
    "34db5094-5ea5-4c8b-88ac-6299d1ea27f2", // Dunes
    "3c8d60fc-b356-48db-995c-7db4b4504029"  // Dungeons
  ];

  console.log(`Updating surferName to 'Tide Raider' for entries: ${ids.join(", ")}...`);

  try {
    for (const id of ids) {
      const updated = await prisma.logEntry.update({
        where: { id: id },
        data: {
          surferName: "Tide Raider"
        }
      });
      console.log(`Successfully updated LogEntry ${id}: surferName = ${updated.surferName}`);
    }
  } catch (error) {
    console.error("Error updating LogEntries:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
