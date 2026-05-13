import { prisma } from './src/lib/prisma';

async function test() {
  const alerts = await prisma.alert.findMany({ 
      where: { userId: 'cmn4owtab0000s60f0dosfbck' } 
  });
  console.log(JSON.stringify(alerts, null, 2));
}

test();
