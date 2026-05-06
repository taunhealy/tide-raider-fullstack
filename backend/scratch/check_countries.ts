import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const countries = await prisma.country.findMany({
    where: {
      OR: [
        { name: { contains: 'America', mode: 'insensitive' } },
        { id: { contains: 'america', mode: 'insensitive' } }
      ]
    },
    include: {
      _count: {
        select: { beaches: true }
      }
    }
  });
  console.log('America Related Countries:', JSON.stringify(countries, null, 2));

  const continents = await prisma.continent?.findMany() || [];
  console.log('Continents:', JSON.stringify(continents, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
