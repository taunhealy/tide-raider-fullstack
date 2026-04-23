import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCredits() {
  const userId = 'cmn4owtab0000s60f0dosfbck';
  const amount = 50;
  
  console.log(`💰 Adding ${amount} credits to user ${userId}...`);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: amount } }
  });

  console.log(`✅ Success! New balance: ${updatedUser.credits}`);
}

addCredits()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
