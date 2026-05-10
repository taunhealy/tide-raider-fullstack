
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const entry = await prisma.logEntry.findFirst({
    where: {
      beachName: { contains: 'Kalk Bay' },
      date: new Date('2026-05-09')
    },
    include: {
      forecast: true
    }
  });
  console.log('Kalk Bay entry for yesterday:', JSON.stringify(entry, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
