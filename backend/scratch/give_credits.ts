
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("--- 💎 CREDIT INJECTION START ---");

  // 1. Find the user by name (Taun Healy)
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: 'Taun Healy', mode: 'insensitive' } },
        { email: { contains: 'taunhealy', mode: 'insensitive' } }
      ]
    }
  });

  if (!user) {
    console.error("❌ User 'Taun Healy' not found.");
    return;
  }

  console.log(`Found user: ${user.name} (${user.email}) | Current Credits: ${user.credits}`);

  // 2. Update credits to 3000
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { credits: 3000 }
  });

  console.log(`✅ Success! ${updatedUser.name} now has ${updatedUser.credits} credits.`);
  console.log("--- 💎 CREDIT INJECTION END ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
