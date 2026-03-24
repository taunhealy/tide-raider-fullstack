import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const beaches = await prisma.beach.findMany({
    where: {
      name: {
        contains: 'Kirra',
        mode: 'insensitive'
      }
    }
  });

  console.log('Beaches found:');
  console.dir(beaches.map(b => ({ id: b.id, name: b.name, regionId: b.regionId, countryId: b.countryId })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
