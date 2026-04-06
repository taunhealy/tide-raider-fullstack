
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const beaches = await prisma.beach.findMany({
    where: { regionId: 'western-cape' },
    select: { id: true, name: true, coordinates: true }
  });

  console.log('Total beaches in Western Cape:', beaches.length);
  
  console.log('--- All Western Cape Beaches ---');
  beaches.forEach(beach => {
    const coordsStr = typeof beach.coordinates === 'string' ? beach.coordinates : JSON.stringify(beach.coordinates);
    console.log(`${beach.id}: ${beach.name} @ ${coordsStr}`);
  });

  const coordinateGroups = {};

  console.log('--- Duplicate Coordinate Analysis ---');
  Object.entries(coordinateGroups).forEach(([coords, names]) => {
    if (names.length > 1) {
      console.log(`${names.length} beaches at ${coords}: ${names.join(', ')}`);
    } else {
        // console.log(`1 beach at ${coords}: ${names[0]}`);
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
