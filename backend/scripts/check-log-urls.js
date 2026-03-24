const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const logs = await prisma.$queryRawUnsafe(`
      SELECT id, "imageUrl", "imageUrls" 
      FROM "LogEntry" 
      WHERE "imageUrl" LIKE '%blueowlmedia.nz%' OR "imageUrl" LIKE '%BEST%SURF%'
      LIMIT 10;
    `);
    console.dir(logs);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
