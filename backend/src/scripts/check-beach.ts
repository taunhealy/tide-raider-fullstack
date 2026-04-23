import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBeach() {
  const beaches = await prisma.beach.findMany({
    where: {
      OR: [
        { name: { contains: 'Inner', mode: 'insensitive' } },
        { name: { contains: 'Kom', mode: 'insensitive' } }
      ]
    },
    include: {
      region: true
    }
  });

  console.log('Beaches found:', JSON.stringify(beaches, null, 2));
}

checkBeach()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
