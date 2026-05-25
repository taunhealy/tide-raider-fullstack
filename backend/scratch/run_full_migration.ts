import { prisma } from "../src/lib/prisma";

const UPDATES = [
  { id: "outer-kom", lat: -34.1453, lng: 18.3163 },
  { id: "inner-kom", lat: -34.1390, lng: 18.3270 },
  { id: "crons", lat: -34.1351, lng: 18.3314 },
  { id: "witsands", lat: -34.1790, lng: 18.3524 },
  { id: "witsand", lat: -34.1790, lng: 18.3524 },
  { id: "clovelly", lat: -34.1265, lng: 18.4330 },
  { id: "clovelly-wedge", lat: -34.1265, lng: 18.4330 },
  { id: "off-the-wall-kalk-bay", lat: -34.13125, lng: 18.45208 },
  { id: "kalk-bay", lat: -34.13125, lng: 18.45208 },
  { id: "boneyards", lat: -34.1328, lng: 18.3261 },
  { id: "boneywards", lat: -34.1328, lng: 18.3261 },
  { id: "fish-hoek", lat: -34.1360, lng: 18.4350 },
  { id: "bikini-beach", lat: -34.1583, lng: 18.8669 },
  { id: "365s", lat: -34.1165, lng: 18.8250 }
];

async function main() {
  console.log("=== STEP 1: Updating Coordinates ===");
  for (const update of UPDATES) {
    try {
      const beach = await prisma.beach.findUnique({
        where: { id: update.id }
      });
      if (beach) {
        await prisma.beach.update({
          where: { id: update.id },
          data: {
            coordinates: {
              lat: update.lat,
              lng: update.lng
            }
          }
        });
        console.log(`✅ [${update.id}] Updated "${beach.name}" coordinates successfully: lat=${update.lat}, lng=${update.lng}`);
      } else {
        console.log(`ℹ️ [${update.id}] Beach not found, skipping.`);
      }
    } catch (err: any) {
      console.error(`❌ Failed to update ${update.id}:`, err.message);
    }
  }

  console.log("\n=== STEP 2: Safely removing duplicate 365s in Strand ===");
  try {
    // Let's find all beaches containing "365"
    const beaches365 = await prisma.beach.findMany({
      where: { name: { contains: "365", mode: "insensitive" } }
    });

    console.log(`🔍 Found ${beaches365.length} beaches with "365" in name:`);
    for (const b of beaches365) {
      console.log(`  - Name: "${b.name}" | ID: "${b.id}" | Coords: ${JSON.stringify(b.coordinates)}`);
    }

    // A duplicate is usually "365s-strand" or similar if it has another entry
    const duplicate = beaches365.find(b => b.id.toLowerCase().includes("strand") || b.name.toLowerCase().includes("strand"));
    if (duplicate) {
      const dupId = duplicate.id;
      const mainId = beaches365.find(b => b.id === "365s")?.id || "365s";
      
      console.log(`🗑️ Deleting duplicate "${duplicate.name}" (${dupId}) and transferring logs to "${mainId}"...`);
      
      // Re-assign logs
      await prisma.logEntry.updateMany({
        where: { beachId: dupId },
        data: { beachId: mainId }
      });

      // Clear daily scores
      await prisma.beachDailyScore.deleteMany({
        where: { beachId: dupId }
      });

      // Clear condition profiles
      await prisma.beachConditionProfile.deleteMany({
        where: { beachId: dupId }
      });

      // Delete duplicate
      await prisma.beach.delete({
        where: { id: dupId }
      });
      console.log("✅ Duplicate beach successfully removed!");
    } else {
      console.log("ℹ️ No duplicate Strand beach with '365' was found to delete.");
    }
  } catch (err: any) {
    console.error("❌ Error while checking/deleting duplicate:", err.message);
  }

  console.log("\n✨ Full migration complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
