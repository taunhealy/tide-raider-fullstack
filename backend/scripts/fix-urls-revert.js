const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Reverting assets.blueowlmedia.nz to media.tideraider.com in LogEntry table using raw SQL...');
    
    // Update imageUrl
    const updateImageUrlCount = await prisma.$executeRawUnsafe(`
      UPDATE "LogEntry"
      SET "imageUrl" = REPLACE("imageUrl", 'assets.blueowlmedia.nz', 'media.tideraider.com')
      WHERE "imageUrl" LIKE '%assets.blueowlmedia.nz%';
    `);
    console.log(`Updated ${updateImageUrlCount} imageUrl fields.`);

    // Update imageUrls array (stored as jsonb)
    const updateImageUrlsCount = await prisma.$executeRawUnsafe(`
      UPDATE "LogEntry"
      SET "imageUrls" = REPLACE("imageUrls"::text, 'assets.blueowlmedia.nz', 'media.tideraider.com')::jsonb
      WHERE "imageUrls"::text LIKE '%assets.blueowlmedia.nz%';
    `);
    console.log(`Updated ${updateImageUrlsCount} imageUrls array fields.`);

    console.log('Updating video URLs as well...');
    const updateVideoUrlCount = await prisma.$executeRawUnsafe(`
      UPDATE "LogEntry"
      SET "videoUrl" = REPLACE("videoUrl", 'assets.blueowlmedia.nz', 'media.tideraider.com')
      WHERE "videoUrl" LIKE '%assets.blueowlmedia.nz%';
    `);
    console.log(`Updated ${updateVideoUrlCount} videoUrl fields.`);

  } catch (e) {
    console.error('Error during update:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
