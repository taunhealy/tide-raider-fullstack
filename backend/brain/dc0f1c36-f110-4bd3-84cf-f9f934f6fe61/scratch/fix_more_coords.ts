import fs from 'fs';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const africaPath = 'k:/Kea/tide-raider-fullstack/next/app/data/continents/africa.json';
let data = JSON.parse(fs.readFileSync(africaPath, 'utf8'));

const updates = {
  "seafarm-pringle-bay": { lat: -34.3512, lng: 18.8267 },
  "palmiet-reef": { lat: -34.3486, lng: 18.8925 },
  "bellows": { lat: -34.3854, lng: 18.4876 },
  "kogelberg-reef": { lat: -34.3612, lng: 18.8345 },
  "moonlight-bay": { lat: -34.3556, lng: 18.8123 },
  "harold-porter": { lat: -34.35, lng: 18.83 },
  "nine-miles": { lat: -34.08, lng: 18.58 },
  "i&js": { lat: -34.1284, lng: 18.4485 },
  "derdesteen": { lat: -33.82, lng: 18.44 },
  "platboom": { lat: -34.3312, lng: 18.4633 },
  "thermopylae": { lat: -33.90, lng: 18.41 },
  "virgin-point": { lat: -34.35, lng: 18.43 },
  "dungeons": { lat: -34.05, lng: 18.32 }
};

// Update JSON
data = data.map(beach => {
  if (updates[beach.id]) {
    beach.coordinates = updates[beach.id];
  }
  return beach;
});
fs.writeFileSync(africaPath, JSON.stringify(data, null, 2));
console.log("✅ Updated JSON coordinates");

// Update DB
async function main() {
  console.log("🚀 Updating DB coordinates...");
  for (const [id, coords] of Object.entries(updates)) {
    try {
      await prisma.beach.update({
        where: { id },
        data: { coordinates: coords }
      });
      console.log(`✅ Updated ${id}`);
    } catch (e: any) {
      console.warn(`⚠️ Could not update ${id}: ${e.message}`);
    }
  }
}

main();
