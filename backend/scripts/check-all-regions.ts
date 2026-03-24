import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const regions = await prisma.region.findMany({ select: { id: true, name: true, countryId: true } });
  
  console.log('All Regions:');
  console.dir(regions);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
