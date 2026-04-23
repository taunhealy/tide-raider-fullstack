import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCredits() {
  const userId = 'cmn4owtab0000s60f0dosfbck';
  const targetAmount = 300;
  
  console.log(`💰 Setting credits to ${targetAmount} for user ${userId}...`);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { credits: targetAmount }
  });

  console.log(`✅ Success! New balance: ${updatedUser.credits}`);
}

updateCredits()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
