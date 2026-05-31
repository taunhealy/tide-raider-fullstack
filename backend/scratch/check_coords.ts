import { prisma } from '../src/lib/prisma';
async function main() {
  const beaches = await prisma.beach.findMany({ select: { id: true, name: true, coordinates: true } });
  let nanCount = 0;
  for (const b of beaches) {
    let coords = b.coordinates as any;
    if (typeof coords === 'string') {
      try { coords = JSON.parse(coords); } catch {}
    }
    const beachLat = coords && typeof coords === 'object' ? parseFloat(coords.lat) : NaN;
    const beachLng = coords && typeof coords === 'object' ? parseFloat(coords.lng) : NaN;
    if (isNaN(beachLat) || isNaN(beachLng)) {
      nanCount++;
      console.log('NaN for', b.name, 'coords:', b.coordinates);
    }
  }
  console.log('Total NaN:', nanCount, 'out of', beaches.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
