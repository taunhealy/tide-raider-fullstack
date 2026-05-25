import { prisma } from "../src/lib/prisma";

async function main() {
  const beachNames = ["Outer Kom", "Inner Kom", "Crons", "Witsands", "Clovelly", "Kalk Bay"];
  
  console.log("=== Inspecting Beach Coordinates in DB ===");
  for (const name of beachNames) {
    const beach = await prisma.beach.findFirst({
      where: { name: { contains: name, mode: 'insensitive' } }
    });
    if (beach) {
      console.log(`🏖️ Name: ${beach.name} | ID: ${beach.id} | Coords:`, JSON.stringify(beach.coordinates));
    } else {
      console.log(`❌ Not found: ${name}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
