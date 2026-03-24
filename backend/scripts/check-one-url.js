const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const entry = await prisma.logEntry.findFirst({
      where: {
        imageUrl: { contains: 'BEST' }
      }
    });
    console.log('ENTRY_IMAGE_URL:' + JSON.stringify(entry.imageUrl));
    console.log('ENTRY_IMAGE_URLS:' + JSON.stringify(entry.imageUrls));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
