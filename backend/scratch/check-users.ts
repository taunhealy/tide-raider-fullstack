import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      subscriptionStatus: true,
      hasActiveTrial: true
    }
  });

  console.log(`Users:`);
  users.forEach(user => {
    console.log(`${user.email}: ${user.subscriptionStatus}, Trial: ${user.hasActiveTrial}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
