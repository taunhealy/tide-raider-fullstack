const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Replacing media.tideraider.com with assets.blueowlmedia.nz in LogEntry table using raw SQL...');
    
    // Update imageUrl
    const updateImageUrlCount = await prisma.$executeRawUnsafe(`
      UPDATE "LogEntry"
      SET "imageUrl" = REPLACE("imageUrl", 'media.tideraider.com', 'assets.blueowlmedia.nz')
      WHERE "imageUrl" LIKE '%media.tideraider.com%';
    `);
    console.log(`Updated ${updateImageUrlCount} imageUrl fields.`);

    // Update imageUrls array (stored as jsonb)
    const updateImageUrlsCount = await prisma.$executeRawUnsafe(`
      UPDATE "LogEntry"
      SET "imageUrls" = REPLACE("imageUrls"::text, 'media.tideraider.com', 'assets.blueowlmedia.nz')::jsonb
      WHERE "imageUrls"::text LIKE '%media.tideraider.com%';
    `);
    console.log(`Updated ${updateImageUrlsCount} imageUrls array fields.`);

    console.log('Updating video URLs as well...');
    const updateVideoUrlCount = await prisma.$executeRawUnsafe(`
      UPDATE "LogEntry"
      SET "videoUrl" = REPLACE("videoUrl", 'media.tideraider.com', 'assets.blueowlmedia.nz')
      WHERE "videoUrl" LIKE '%media.tideraider.com%';
    `);
    console.log(`Updated ${updateVideoUrlCount} videoUrl fields.`);

  } catch (e) {
    console.error('Error during update:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
