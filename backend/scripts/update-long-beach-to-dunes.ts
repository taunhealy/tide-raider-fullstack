
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const logEntryId = "34db5094-5ea5-4c8b-88ac-6299d1ea27f2";
  const newBeachId = "dunes";
  const newComments = "Ideal conditions today at Dunes! Light-to-moderate SE winds holding open the peaks. Perfect A-frame barrels on the 4-6ft swell. Crystal clear water and light offshore breeze.";

  console.log(`Updating LogEntry ${logEntryId} to beachId: ${newBeachId}...`);

  try {
    const updatedEntry = await prisma.logEntry.update({
      where: { id: logEntryId },
      data: {
        beachId: newBeachId,
        comments: newComments,
        beachName: "Dunes"
      }
    });

    console.log("Successfully updated LogEntry:");
    console.log({
      id: updatedEntry.id,
      beachId: updatedEntry.beachId,
      comments: updatedEntry.comments
    });
  } catch (error) {
    console.error("Error updating LogEntry:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
