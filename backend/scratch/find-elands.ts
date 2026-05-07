import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const beaches = await prisma.beach.findMany({
    where: { name: { contains: "Elands", mode: "insensitive" } }
  });
  console.log(beaches.map(b => b.name));
}
main().finally(() => prisma.$disconnect());
