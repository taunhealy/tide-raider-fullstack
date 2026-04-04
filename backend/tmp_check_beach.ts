
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const query = "Brandfontein";
  
  const beaches = await prisma.beach.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive'
      }
    }
  });
  console.log(`Beaches found with "${query}": ${beaches.length}`);
  beaches.forEach(b => console.log(` - Beach: ${b.name} (${b.id})`));

  const gems = await prisma.hiddenGem.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive'
      }
    }
  });
  console.log(`HiddenGems found with "${query}": ${gems.length}`);
  gems.forEach(g => console.log(` - HiddenGem: ${g.name} (${g.id})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
