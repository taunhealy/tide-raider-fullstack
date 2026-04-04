
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: "taunhealy@gmail.com" },
        { email: "admin@tideraider.com" },
        { id: "cmnhjq35d000cs60fxss02p4o" }
      ]
    }
  });

  console.log("Matching users:");
  console.log(JSON.stringify(users.map(u => ({ id: u.id, email: u.email, status: u.subscriptionStatus })), null, 2));

  await prisma.$disconnect();
}

main();
