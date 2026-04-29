
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const paranoia = await prisma.beach.findUnique({
    where: { id: "paranoia" },
    select: { name: true, coordinates: true }
  });
  console.log("Paranoia Data from DB:", JSON.stringify(paranoia, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
