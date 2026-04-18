import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const updates = [
  { id: "donkin-bay", lat: -31.9167, lng: 18.2667 },
  { id: "mossel-bay", lat: -34.1831, lng: 22.1461 },
  { id: "famous", lat: -32.3125, lng: 18.3031 },
  { id: "buffels-bay", lat: -34.3213, lng: 18.4552 },
  { id: "platboom", lat: -34.3312, lng: 18.4633 },
  { id: "strand", lat: -34.1147, lng: 18.8306 },
  { id: "hermanus", lat: -34.4167, lng: 19.2333 }
];

async function main() {
  console.log("🚀 Updating coordinated for reported beaches...");
  for (const update of updates) {
    try {
      await prisma.beach.update({
        where: { id: update.id },
        data: {
          coordinates: { lat: update.lat, lng: update.lng }
        }
      });
      console.log(`✅ Updated ${update.id}`);
    } catch (e) {
      console.warn(`⚠️ Could not update ${update.id}: ${e.message}`);
    }
  }
}

main();
