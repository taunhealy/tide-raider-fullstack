
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beachId = "long-beach";
  const userId = "cmnhjq35d000cs60fxss02p4o"; // Admin user
  const regionId = "western-cape";
  const baseUrl = "https://media.tideraider.com";

  const rawImage = "20252011_Long-Beach_3-cover.webp";
  const imageUrl = `${baseUrl}/${encodeURIComponent(rawImage)}`;

  console.log(`Seeding October 2025 LogEntry for Long Beach with image: ${imageUrl}...`);

  try {
    const logEntry = await prisma.logEntry.create({
      data: {
        date: new Date("2025-10-20"), // Set to October 20, 2025
        beachId: beachId,
        userId: userId,
        regionId: regionId,
        surferRating: 4,
        comments: "Good conditions at Long Beach in October. Early morning session with light winds and clean waves.",
        imageUrl: imageUrl, 
        imageUrls: [imageUrl],
        waveType: "BEACH_BREAK",
        isPrivate: false,
        isAnonymous: false,
        surferName: "Tide Raider",
      }
    });

    console.log("Successfully created October 2025 Long Beach LogEntry:");
    console.log({
      id: logEntry.id,
      beachId: logEntry.beachId,
      rating: logEntry.surferRating,
      date: logEntry.date
    });
  } catch (error) {
    console.error("Error creating LogEntry:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
