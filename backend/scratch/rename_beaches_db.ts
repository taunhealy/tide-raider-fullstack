import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Running database migration to rename beaches...");

  // 1. Rename Chrystal Road to Crystal Road (Pringle Bay -> Betty's Bay)
  console.log("Updating Chrystal Road references...");
  
  // Beach Table
  try {
    const beach = await prisma.beach.updateMany({
      where: { id: "chrystal-road" },
      data: {
        name: "Crystal Road",
        location: "Betty's Bay",
        description: "Crystal Road is a consistent right-hand break with a mix of sand and rocks. It offers rides under 50m and works best on medium to high tides with SE or NW winds. Watch out for rips and rocks."
      }
    });
    console.log(`✓ Updated ${beach.count} records in Beach table for Chrystal Road.`);
  } catch (err: any) {
    console.error("Error updating Chrystal Road in Beach table:", err.message);
  }

  // HiddenGem Table
  try {
    const gem = await prisma.hiddenGem.updateMany({
      where: { id: "chrystal-road" },
      data: {
        name: "Crystal Road",
        location: "Betty's Bay",
        description: "Crystal Road is a consistent right-hand break with a mix of sand and rocks. It offers rides under 50m and works best on medium to high tides with SE or NW winds. Watch out for rips and rocks."
      }
    });
    console.log(`✓ Updated ${gem.count} records in HiddenGem table for Chrystal Road.`);
  } catch (err: any) {
    console.error("Error updating Chrystal Road in HiddenGem table:", err.message);
  }

  // LogEntry Table
  try {
    const logs = await prisma.logEntry.updateMany({
      where: {
        OR: [
          { beachId: "chrystal-road" },
          { beachName: "Chrystal Road" }
        ]
      },
      data: {
        beachName: "Crystal Road"
      }
    });
    console.log(`✓ Updated ${logs.count} records in LogEntry table for Chrystal Road.`);
  } catch (err: any) {
    console.error("Error updating Chrystal Road in LogEntry table:", err.message);
  }

  // 2. Rename Masencamp to Camp (False Bay / Kogelberg -> Kogelberg)
  console.log("Updating Masencamp references...");

  // Beach Table
  try {
    const beach = await prisma.beach.updateMany({
      where: { id: "masencamp-reef" },
      data: {
        name: "Camp",
        location: "Kogelberg"
      }
    });
    console.log(`✓ Updated ${beach.count} records in Beach table for Masencamp.`);
  } catch (err: any) {
    console.error("Error updating Masencamp in Beach table:", err.message);
  }

  // HiddenGem Table
  try {
    const gem = await prisma.hiddenGem.updateMany({
      where: { id: "masencamp-reef" },
      data: {
        name: "Camp",
        location: "Kogelberg",
        description: "Tactical reef break. Needs SE wind and strong SW swell (2.3m min). High performance wave for advanced riders."
      }
    });
    console.log(`✓ Updated ${gem.count} records in HiddenGem table for Masencamp.`);
  } catch (err: any) {
    console.error("Error updating Masencamp in HiddenGem table:", err.message);
  }

  // LogEntry Table
  try {
    const logs = await prisma.logEntry.updateMany({
      where: {
        OR: [
          { beachId: "masencamp-reef" },
          { beachName: "Masencamp" }
        ]
      },
      data: {
        beachName: "Camp"
      }
    });
    console.log(`✓ Updated ${logs.count} records in LogEntry table for Masencamp.`);
  } catch (err: any) {
    console.error("Error updating Masencamp in LogEntry table:", err.message);
  }

  console.log("✅ Database migration complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
