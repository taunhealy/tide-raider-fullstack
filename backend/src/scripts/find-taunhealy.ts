import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findUser() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'Taunhealy', mode: 'insensitive' } },
        { email: { contains: 'taunhealy', mode: 'insensitive' } }
      ]
    }
  });

  console.log('Users found:', JSON.stringify(users, null, 2));
}

findUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
