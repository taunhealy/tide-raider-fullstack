
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking Region IDs...");
  
  const regions = await prisma.region.findMany({
    select: { id: true, name: true },
    orderBy: { id: 'asc' }
  });

  console.log(`Found ${regions.length} regions.`);
  
  const easternCapeRegions = regions.filter(r => r.name.toLowerCase().includes('eastern'));
  console.log("Regions matching 'eastern':");
  easternCapeRegions.forEach(r => console.log(`- ID: '${r.id}', Name: '${r.name}'`));

  const exactMatch = regions.find(r => r.id === 'eastern-cape');
  console.log("Exact match for 'eastern-cape':", exactMatch ? "YES" : "NO");

  const capMatch = regions.find(r => r.id === 'Eastern Cape');
  console.log("Exact match for 'Eastern Cape':", capMatch ? "YES" : "NO");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
