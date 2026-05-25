import { prisma } from "../src/lib/prisma";

const TARGETS = [
  { match: "Outer Kom", lat: -34.1453, lng: 18.3163 },
  { match: "Inner Kom", lat: -34.1390, lng: 18.3270 },
  { match: "Crons", lat: -34.1351, lng: 18.3314 },
  { match: "Witsand", lat: -34.1790, lng: 18.3524 }, // Handles both witsand and witsands
  { match: "Clovelly", lat: -34.1265, lng: 18.4330 },
  { match: "Kalk Bay", lat: -34.13125, lng: 18.45208 }
];

async function main() {
  console.log("=== Updating Coordinates of South African breaks ===");
  for (const target of TARGETS) {
    const beaches = await prisma.beach.findMany({
      where: { name: { contains: target.match, mode: 'insensitive' } }
    });
    
    if (beaches.length === 0) {
      console.log(`❌ No database matches found for search term: "${target.match}"`);
      continue;
    }
    
    for (const beach of beaches) {
      const updated = await prisma.beach.update({
        where: { id: beach.id },
        data: {
          coordinates: {
            lat: target.lat,
            lng: target.lng
          }
        }
      });
      console.log(`✅ [${beach.id}] Updated "${beach.name}" coordinates successfully: lat=${target.lat}, lng=${target.lng}`);
    }
  }
  console.log("✨ Coordinate update completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
