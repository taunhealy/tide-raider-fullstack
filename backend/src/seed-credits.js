const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCredits() {
  try {
    const userName = 'Taun Healy';
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: userName, mode: 'insensitive' } },
          { email: 'taunhealy@gmail.com' } // common email for Taun
        ]
      }
    });

    if (user) {
      console.log(`Found user: ${user.name} (${user.email})`);
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { credits: 300 }
      });
      console.log(`Updated credits for ${updated.name} to ${updated.credits}`);
    } else {
      console.log(`User "${userName}" not found.`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCredits();
