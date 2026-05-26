import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const beaches = await prisma.beach.findMany({
    where: { isHiddenGem: true }
  });
  console.log(`Found ${beaches.length} hidden gems in DB:`);
  beaches.forEach(b => {
    console.log(`- ID: ${b.id}, Name: ${b.name}, Location: ${b.location}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
