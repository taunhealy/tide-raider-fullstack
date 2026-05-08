import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      id: "cmnhjq35d000cs60fxss02p4o"
    }
  });

  console.log("Current User:", JSON.stringify(user, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
