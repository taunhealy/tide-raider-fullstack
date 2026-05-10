
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.logEntry.findMany({
    where: {
      date: {
        gte: new Date('2026-05-01')
      },
      NOT: {
        beachName: { contains: 'DUMMY' }
      }
    },
    include: {
      forecast: true
    }
  });
  console.log(JSON.stringify(entries, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
