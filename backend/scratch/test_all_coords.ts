import { prisma } from '../src/lib/prisma';

async function check() {
  const beaches = await prisma.beach.findMany({
    select: { name: true, coordinates: true }
  });
  
  let valid = 0;
  let invalid = 0;
  let sampleInvalid: any = null;

  for (const b of beaches) {
    const c = b.coordinates as any;
    if (c && typeof c === 'object' && c.lat !== undefined && c.lng !== undefined) {
      valid++;
    } else {
      invalid++;
      if (!sampleInvalid) sampleInvalid = c;
    }
  }

  console.log(`Valid: ${valid}, Invalid: ${invalid}`);
  if (sampleInvalid) console.log(`Sample invalid coords:`, sampleInvalid);
}

check().catch(console.error).finally(() => prisma.$disconnect());
