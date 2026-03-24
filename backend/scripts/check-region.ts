import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const regions = await prisma.region.findMany({
    where: {
      OR: [
        { name: { contains: 'Gold', mode: 'insensitive' } },
        { name: { contains: 'Australia', mode: 'insensitive' } },
        { countryId: 'au' }
      ]
    }
  });

  console.log('Regions found:');
  console.dir(regions.map(r => ({ id: r.id, name: r.name, countryId: r.countryId })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
