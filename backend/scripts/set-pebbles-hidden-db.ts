
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.beach.update({
    where: { id: "pebbles" },
    data: { isHiddenGem: true }
  });
  console.log("✅ Pebbles set to hidden gem in DB");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
