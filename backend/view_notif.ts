import { prisma } from './src/lib/prisma';

async function test() {
  const n = await prisma.alertNotification.findFirst({ 
      where: { id: '775f9ea6-02eb-4a91-abd8-3f607abde771' } 
  });
  if (n) {
      console.log(n.details);
  } else {
      console.log('Not found');
  }
}

test();
