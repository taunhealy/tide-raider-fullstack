import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const updates = [
  { id: "donkin-bay", lat: -31.9167, lng: 18.2667 },
  { id: "mossel-bay", lat: -34.1831, lng: 22.1461 },
  { id: "famous", lat: -32.3125, lng: 18.3031 },
  { id: "buffels-bay", lat: -34.3213, lng: 18.4552 },
  { id: "platboom", lat: -34.3312, lng: 18.4633 },
  { id: "strand", lat: -34.1147, lng: 18.8306 },
  { id: "hermanus", lat: -34.4167, lng: 19.2333 },
  { id: "i&js", lat: -34.1284, lng: 18.4485 },
  { id: "clovelly", lat: -34.1264, lng: 18.4447 },
  { id: "long-beach", lat: -34.1361, lng: 18.3278 },
  { id: "dunes", lat: -34.1385, lng: 18.3305 },
  { id: "sandy-bay", lat: -34.0326, lng: 18.3357 },
  { id: "noordhoek", lat: -34.1156, lng: 18.3587 },
  { id: "horse-trails", lat: -34.1556, lng: 18.3227 },
  { id: "the-hoek", lat: -34.1326, lng: 18.3347 },
  { id: "glen-beach", lat: -33.9397, lng: 18.3775 }
];

async function main() {
  console.log("🚀 Starting mass coordinate update in DB...");
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
