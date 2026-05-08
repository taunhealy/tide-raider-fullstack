import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const beach = await prisma.beach.findFirst({
    where: { name: { contains: 'Muizenberg', mode: 'insensitive' } }
  });
  console.log('Muizenberg:', beach);
  
  const llandudno = await prisma.beach.findFirst({
    where: { name: { contains: 'Llandudno', mode: 'insensitive' } }
  });
  console.log('Llandudno:', llandudno);
}

main().catch(console.error).finally(() => prisma.$disconnect());
