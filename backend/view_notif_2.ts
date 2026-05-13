import { prisma } from './src/lib/prisma';

async function test() {
  const n = await prisma.alertNotification.findFirst({ 
      where: { id: 'fb42060a-8d2a-4a98-b284-129a0510768f' } 
  });
  if (n) {
      console.log(n.details);
  } else {
      console.log('Not found');
  }
}

test();
