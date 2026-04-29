
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: "cmn4owtab0000s60f0dosfbck" },
    select: { id: true, email: true, credits: true, subscriptionStatus: true }
  });
  console.log("User Data from DB:", JSON.stringify(user, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
