import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const scores = await prisma.beachDailyScore.findMany({
    where: {
      regionId: 'western-cape',
      date: {
        gte: new Date('2026-05-14T00:00:00Z'),
        lte: new Date('2026-05-14T23:59:59Z')
      }
    },
    take: 10
  });
  console.log(JSON.stringify(scores, null, 2));
}

main().finally(() => prisma.$disconnect());
