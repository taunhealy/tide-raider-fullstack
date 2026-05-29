import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beachId = "long-beach";
  const userId = "cmpp7q3m90075s60ef1r056yz"; // admin@tideraider.com
  const regionId = "western-cape";
  const baseUrl = "https://media.tideraider.com";

  const rawImages = [
    "20252011_Long-Beach_3-cover.webp",
    "20252011_Long-Beach_Mid-day (1 of 10).webp",
    "20252011_Long-Beach_Mid-day (1 of 11).webp",
    "20252011_Long-Beach_Mid-day (10 of 10).webp",
    "20252011_Long-Beach_Mid-day (10 of 11).webp",
    "20252011_Long-Beach_Mid-day (11 of 11).webp",
    "20252011_Long-Beach_Mid-day (17 of 29).webp",
    "20252011_Long-Beach_Mid-day (2 of 10).webp",
    "20252011_Long-Beach_Mid-day (2 of 11).webp",
    "20252011_Long-Beach_Mid-day (3 of 10).webp",
    "20252011_Long-Beach_Mid-day (3 of 11).webp",
    "20252011_Long-Beach_Mid-day (4 of 10).webp",
    "20252011_Long-Beach_Mid-day (4 of 11).webp",
    "20252011_Long-Beach_Mid-day (5 of 10).webp",
    "20252011_Long-Beach_Mid-day (5 of 11).webp",
    "20252011_Long-Beach_Mid-day (6 of 10).webp",
    "20252011_Long-Beach_Mid-day (6 of 11).webp",
    "20252011_Long-Beach_Mid-day (7 of 10).webp",
    "20252011_Long-Beach_Mid-day (7 of 11).webp",
    "20252011_Long-Beach_Mid-day (8 of 10).webp",
    "20252011_Long-Beach_Mid-day (8 of 11).webp",
    "20252011_Long-Beach_Mid-day (9 of 10).webp",
    "20252011_Long-Beach_Mid-day (9 of 11).webp"
  ];

  const imageUrls = rawImages.map(img => `${baseUrl}/${encodeURIComponent(img)}`);
  const imageUrl = imageUrls[0];

  console.log(`Seeding October 2025 LogEntry for Long Beach with ${imageUrls.length} images...`);

  try {
    const logEntry = await prisma.logEntry.create({
      data: {
        date: new Date("2025-10-15"), // Set to a mid-October 2025 date
        beachId: beachId,
        userId: userId,
        regionId: regionId,
        surferRating: 4,
        comments: "Close to ideal conditions at Long Beach. Great session.",
        imageUrl: imageUrl, 
        imageUrls: imageUrls,
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
