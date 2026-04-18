import fs from 'fs';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const africaPath = 'k:/Kea/tide-raider-fullstack/next/app/data/continents/africa.json';
let data = JSON.parse(fs.readFileSync(africaPath, 'utf8'));

const updates = {
  "crayfish-factory": { lat: -34.1956, lng: 18.3445 },
  "olifants-bos": { lat: -34.2541, lng: 18.3842 },
  "ding-dangs": { lat: -34.0583, lng: 23.3642 }
};

// Update JSON
data = data.map(beach => {
  if (updates[beach.id]) {
    beach.coordinates = updates[beach.id];
  }
  return beach;
});
fs.writeFileSync(africaPath, JSON.stringify(data, null, 2));
console.log("✅ Updated JSON coordinates for the new list");

// Update DB
async function main() {
  console.log("🚀 Updating DB coordinates for the new list...");
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
