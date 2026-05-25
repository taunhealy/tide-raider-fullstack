import { prisma } from "../src/lib/prisma";

async function main() {
  const terms = ["Boney", "Fish Hoek", "Bikini", "365"];
  console.log("=== Inspecting New Targets in DB ===");
  for (const term of terms) {
    const beaches = await prisma.beach.findMany({
      where: { name: { contains: term, mode: 'insensitive' } }
    });
    console.log(`\n🔍 Matches for "${term}":`);
    for (const b of beaches) {
      console.log(`  - Name: "${b.name}" | ID: "${b.id}" | Coords:`, JSON.stringify(b.coordinates));
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
