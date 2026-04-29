import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const muiz = await prisma.beach.findUnique({
    where: { id: "muizenberg-beach" },
    include: { conditionProfiles: true }
  });
  console.log("Muizenberg Data from DB:", JSON.stringify(muiz, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
