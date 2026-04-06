
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Target coordinates often used as generic defaults in Western Cape
  const badLat = -34.1012;
  const badLng = 18.4987;

  console.log('Searching for ghost beaches...');
  
  // prisma findMany doesn't easily compare json fields with strict equality in some versions without raw or specific paths
  // We'll fetch all and filter in JS for safety
  const beaches = await prisma.beach.findMany({
    where: { regionId: 'western-cape' }
  });

  const toDelete = beaches.filter(b => {
    try {
      const coords = typeof b.coordinates === 'string' ? JSON.parse(b.coordinates) : b.coordinates;
      return Math.abs(coords.lat - badLat) < 0.001 && Math.abs(coords.lng - badLng) < 0.001;
    } catch (e) {
      return false;
    }
  });

  console.log(`Found ${toDelete.length} ghost beaches to remove.`);

  for (const beach of toDelete) {
    console.log(`Deleting ${beach.id} (${beach.name})...`);
    // Delete scores first if there are any
    await prisma.beachDailyScore.deleteMany({
      where: { beachId: beach.id }
    });
    await prisma.beach.delete({
      where: { id: beach.id }
    });
  }

  console.log('Cleanup complete.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
