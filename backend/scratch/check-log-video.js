
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const entry = await prisma.logEntry.findUnique({
    where: { id: 'b5438909-67bf-41cb-b231-33400c369fff' },
    select: {
      id: true,
      videoUrl: true,
      videoUrls: true,
      videoPlatform: true
    }
  });
  console.log(JSON.stringify(entry, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
