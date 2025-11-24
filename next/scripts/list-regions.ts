
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching regions...');
  const regions = await prisma.region.findMany({
    include: {
      _count: {
        select: { beaches: true }
      }
    }
  });

  console.log('Regions found:', regions.length);
  regions.forEach(r => {
    console.log(`- ${r.name} (ID: ${r.id}) - Beaches: ${r._count.beaches}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
