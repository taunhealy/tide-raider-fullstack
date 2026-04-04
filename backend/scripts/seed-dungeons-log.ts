
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beachId = "dungeons";
  const userId = "cmnhjq35d000cs60fxss02p4o"; // Admin user
  const regionId = "western-cape";
  const videoUrl = "https://www.youtube.com/shorts/a9aHYiL2f8E";

  console.log(`Seeding LogEntry for Dungeons with video: ${videoUrl}...`);

  try {
    const logEntry = await prisma.logEntry.create({
      data: {
        date: new Date(),
        beachId: beachId,
        userId: userId,
        regionId: regionId,
        surferRating: 5,
        comments: "Great conditions today at Dungeons! The size was impressive and the vibe was epic.",
        videoUrl: videoUrl,
        videoPlatform: "YOUTUBE",
        waveType: "REEF_BREAK",
        isPrivate: false,
        isAnonymous: false,
        surferName: "Admin",
      }
    });

    console.log("Successfully created LogEntry:");
    console.log({
      id: logEntry.id,
      beachId: logEntry.beachId,
      rating: logEntry.surferRating,
      video: logEntry.videoUrl
    });
  } catch (error) {
    console.error("Error creating LogEntry:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
