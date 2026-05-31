import { prisma } from '../src/lib/prisma';

async function fix() {
  await prisma.user.update({
    where: { id: "cmnhjq35d000cs60fxss02p4o" },
    data: { credits: 100 }
  });
  console.log("Added credits");
}

fix().catch(console.error).finally(() => prisma.$disconnect());
