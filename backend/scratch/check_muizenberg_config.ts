import { prisma } from "../src/lib/prisma";

async function main() {
  const beach = await prisma.beach.findUnique({
    where: { id: "muizenberg-beach" }
  });
  console.log("Muizenberg Beach configuration:", JSON.stringify(beach, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
