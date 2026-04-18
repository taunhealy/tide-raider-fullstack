import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const updates = [
  { id: "wilderness", lat: -33.9912, lng: 22.5807 },
  { id: "platboom", lat: -34.3312, lng: 18.4633 },
  { id: "buffels-bay", lat: -34.3213, lng: 18.4552 },
  { id: "strand", lat: -34.1147, lng: 18.8306 },
  { id: "hermanus", lat: -34.4167, lng: 19.2333 },
  { id: "holbaai", lat: -33.6744, lng: 18.4533 },
  { id: "beachroad", lat: -33.7258, lng: 18.4411 },
  { id: "clovelly", lat: -34.1264, lng: 18.4447 },
  { id: "i-n-j-s", lat: -34.1284, lng: 18.4485 }
];

async function main() {
  console.log("🚀 Starting mass coordinate update...");
  try {
    for (const update of updates) {
      console.log(`Updating ${update.id}...`);
      await prisma.beach.update({
        where: { id: update.id },
        data: {
          coordinates: {
            lat: update.lat,
            lng: update.lng
          }
        }
      });
      console.log(`✅ Updated ${update.id}`);
    }
    console.log("🎉 All updates completed successfully!");
  } catch (error) {
    console.error("❌ Error during mass update:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
