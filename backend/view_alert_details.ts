import { prisma } from './src/lib/prisma';

async function test() {
  const alert = await prisma.alert.findFirst({ 
      where: { name: { contains: 'Long Beach' } },
      include: { logEntry: true }
  });
  console.log(JSON.stringify(alert, null, 2));
}

test();
