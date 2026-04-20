import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRegion() {
  const query = 'western-cape';
  console.log(`Checking Region for query: ${query}`);
  
  const region = await prisma.region.findFirst({
    where: {
      OR: [
        { id: query },
        { name: { contains: query, mode: 'insensitive' } }
      ]
    }
  });
  
  console.log('Result:', JSON.stringify(region, null, 2));
  await prisma.$disconnect();
}

checkRegion().catch(console.error);
