import { prisma } from '../src/lib/prisma';

async function check() {
  const beach = await prisma.beach.findFirst({
    where: { regionId: 'western-cape' },
    select: { name: true, coordinates: true }
  });
  console.log(`Beach: ${beach?.name}`);
  console.log(`Coordinates:`, beach?.coordinates);
  console.log(`Type:`, typeof beach?.coordinates);
}

check().catch(console.error).finally(() => prisma.$disconnect());
