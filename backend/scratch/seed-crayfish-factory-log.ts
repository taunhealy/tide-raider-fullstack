import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const beachId = "crayfish-factory";
  const email = "admin@tideraider.com";
  const regionId = "western-cape";
  const videoUrl = "https://www.youtube.com/watch?v=V2wN755pne8";

  console.log(`Seeding LogEntry for Crayfish Factory by ${email}...`);

  try {
    // 1. Find the user to get the correct name and id
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error(`User with email ${email} not found!`);
    }

    console.log(`Found user: ${user.name} (${user.id})`);

    // 2. Create the log entry
    const logEntry = await prisma.logEntry.create({
      data: {
        date: new Date("2026-05-28T12:00:00Z"),
        beachId: beachId,
        beachName: "Crayfish Factory",
        userId: user.id,
        surferEmail: email,
        surferName: user.name,
        regionId: regionId,
        surferRating: 5,
        comments: "Jordy Smith a/t FACTORY",
        videoUrl: videoUrl,
        videoPlatform: "YOUTUBE",
        waveType: "POINT_BREAK",
        isPrivate: false,
        isAnonymous: false,
      }
    });

    console.log("Successfully created LogEntry:");
    console.log(JSON.stringify(logEntry, null, 2));
  } catch (error) {
    console.error("Error creating LogEntry:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
