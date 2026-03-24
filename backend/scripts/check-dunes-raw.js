const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const entry = await prisma.$queryRawUnsafe(
      'SELECT id, "beachName", "imageUrl", "imageUrls" FROM "LogEntry" WHERE "beachName" ILIKE \'%Dunes%\' OR "imageUrl" ILIKE \'%Dunes%\' LIMIT 1;'
    );
    console.log('DUNES_LOG:' + JSON.stringify(entry, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
