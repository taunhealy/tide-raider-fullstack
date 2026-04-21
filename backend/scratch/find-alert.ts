import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const alerts = await prisma.alert.findMany({
    where: {
      name: {
        contains: "Witsands",
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      userId: true,
      notificationMethod: true,
      contactInfo: true,
    },
  });
  console.log("ALERTS_FOUND:", JSON.stringify(alerts, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
