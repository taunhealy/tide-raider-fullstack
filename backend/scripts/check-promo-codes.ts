import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const codes = await prisma.promoCode.findMany();
  console.log("Promo codes in database:");
  codes.forEach((code) => {
    console.log({
      id: code.id,
      code: code.code,
      isActive: code.isActive,
      usedCount: code.usedCount,
      maxUses: code.maxUses,
    });
  });
  await prisma.$disconnect();
}

main();

