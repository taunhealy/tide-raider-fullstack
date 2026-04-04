
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beachId = "long-beach";
  const userId = "cmnhjq35d000cs60fxss02p4o"; // Admin user
  const regionId = "western-cape";
  const baseUrl = "https://media.tideraider.com";

  const rawImages = [
    "20252011_Long-Beach_Mid-day (1 of 11).webp",
    "20252011_Long-Beach_Mid-day (10 of 11).webp",
    "20252011_Long-Beach_Mid-day (11 of 11).webp",
    "20252011_Long-Beach_Mid-day (17 of 29).webp",
    "20252011_Long-Beach_Mid-day (2 of 11).webp",
    "20252011_Long-Beach_Mid-day (3 of 11).webp",
    "20252011_Long-Beach_Mid-day (4 of 11).webp",
    "20252011_Long-Beach_Mid-day (5 of 11).webp",
    "20252011_Long-Beach_Mid-day (6 of 11).webp",
    "20252011_Long-Beach_Mid-day (7 of 11).webp",
    "20252011_Long-Beach_Mid-day (8 of 11).webp",
    "20252011_Long-Beach_Mid-day (9 of 11).webp",
  ];

  const imageUrls = rawImages.map(img => `${baseUrl}/${encodeURIComponent(img)}`);

  console.log(`Seeding LogEntry for Long Beach with ${imageUrls.length} images...`);

  try {
    const logEntry = await prisma.logEntry.create({
      data: {
        date: new Date(),
        beachId: beachId,
        userId: userId,
        regionId: regionId,
        surferRating: 4,
        comments: "Good conditions today! Mid-day session at Long Beach. Clean lines and consistent sets.",
        imageUrl: imageUrls[0], // Primary image
        imageUrls: imageUrls,   // All images
        waveType: "BEACH_BREAK",
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
      imagesCount: (logEntry.imageUrls as any[])?.length || 0
    });
  } catch (error) {
    console.error("Error creating LogEntry:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
