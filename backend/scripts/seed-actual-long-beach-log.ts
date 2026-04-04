
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beachId = "long-beach";
  const userId = "cmnhjq35d000cs60fxss02p4o"; // Admin user
  const regionId = "western-cape";
  const baseUrl = "https://media.tideraider.com";

  const rawImages = [
    "20252011_Long-Beach_Mid-day (1 of 10).webp",
    "20252011_Long-Beach_Mid-day (10 of 10).webp",
    "20252011_Long-Beach_Mid-day (2 of 10).webp",
    "20252011_Long-Beach_Mid-day (3 of 10).webp",
    "20252011_Long-Beach_Mid-day (4 of 10).webp",
    "20252011_Long-Beach_Mid-day (5 of 10).webp",
    "20252011_Long-Beach_Mid-day (6 of 10).webp",
    "20252011_Long-Beach_Mid-day (7 of 10).webp",
    "20252011_Long-Beach_Mid-day (8 of 10).webp",
    "20252011_Long-Beach_Mid-day (9 of 10).webp",
  ];

  const imageUrls = rawImages.map(img => `${baseUrl}/${encodeURIComponent(img)}`);

  console.log(`Seeding actual LogEntry for Long Beach with ${imageUrls.length} images...`);

  try {
    const logEntry = await prisma.logEntry.create({
      data: {
        date: new Date("2025-11-20"), // Set to Nov 20, 2025
        beachId: beachId,
        userId: userId,
        regionId: regionId,
        surferRating: 3,
        comments: "Decent conditions at Long Beach. Mid-day session with moderate swell and clean-ish peaks.",
        imageUrl: imageUrls[0], // Primary image
        imageUrls: imageUrls,   // All images
        waveType: "BEACH_BREAK",
        isPrivate: false,
        isAnonymous: false,
        surferName: "Tide Raider",
      }
    });

    console.log("Successfully created actual Long Beach LogEntry:");
    console.log({
      id: logEntry.id,
      beachId: logEntry.beachId,
      rating: logEntry.surferRating,
      imagesCount: (logEntry.imageUrls as any[])?.length || 0,
      date: logEntry.date
    });
  } catch (error) {
    console.error("Error creating LogEntry:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
