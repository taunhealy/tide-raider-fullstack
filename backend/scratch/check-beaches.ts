import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBeaches() {
  const regionId = 'western-cape';
  console.log(`Checking Beaches for regionId: ${regionId}`);
  
  const count = await prisma.beach.count({
    where: { regionId }
  });
  
  console.log('Beach Count:', count);
  
  if (count > 0) {
    const first = await prisma.beach.findFirst({
      where: { regionId },
      select: { id: true, name: true, regionId: true }
    });
    console.log('Sample Beach:', JSON.stringify(first, null, 2));
  }
  
  await prisma.$disconnect();
}

checkBeaches().catch(console.error);
