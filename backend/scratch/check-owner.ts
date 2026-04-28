import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const log = await prisma.logEntry.findFirst({
    where: {
      beachName: "Glencairn"
    },
    select: {
      userId: true,
      user: {
        select: {
          email: true
        }
      }
    }
  });

  console.log(`Log Owner:`, log);
}

main().catch(console.error).finally(() => prisma.$disconnect());
