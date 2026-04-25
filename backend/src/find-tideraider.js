const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findTideRaider() {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'Tide Raider', mode: 'insensitive' } },
          { email: 'tideraider.official@gmail.com' }
        ]
      }
    });
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

findTideRaider();
