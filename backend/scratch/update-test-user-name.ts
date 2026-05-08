import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'cmn4owtab0000s60f0dosfbck';
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: 'Tide Raider' }
  });

  console.log('User Name Updated:', user.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());
