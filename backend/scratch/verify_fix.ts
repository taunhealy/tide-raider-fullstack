import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const countryCounts = await prisma.beach.groupBy({
    by: ['countryId'],
    _count: {
      _all: true
    }
  });
  console.log('Country ID counts:', JSON.stringify(countryCounts, null, 2));

  const countries = await prisma.country.findMany();
  console.log('Remaining Countries:', JSON.stringify(countries.map(c => ({ id: c.id, name: c.name })), null, 2));
  
  const continents = await (prisma.continent as any).findMany();
  console.log('Remaining Continents:', JSON.stringify(continents, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
