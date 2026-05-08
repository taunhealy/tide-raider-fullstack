import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { id: 'cmn4owtab0000s60f0dosfbck' },
    data: { 
      link: 'https://tideraider.ai', 
      instagram: '@tideraider' 
    }
  });
  console.log('User Profile Updated:', user.name, user.link, user.instagram);
}

main().catch(console.error).finally(() => prisma.$disconnect());
