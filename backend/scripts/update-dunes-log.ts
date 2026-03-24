import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const id = 'ca12de6f-923d-4175-b58d-36831a6e30b0';
  const fileName = 'BEST SURF _ DUNES (P2) _ Session 2026 03 08 #walkonwater #surf #westcoast #capetown #_) 0-18 screenshot.webp';
  const publicUrl = process.env.R2_PUBLIC_URL || 'https://media.tideraider.com';
  // Use the full R2 URL instead of relative path
  const fullUrl = `${publicUrl}/${encodeURIComponent(fileName)}`;
  
  const imageUrlsJson = JSON.stringify([fullUrl]);

  try {
    await prisma.$executeRaw`
      UPDATE "LogEntry"
      SET "imageUrl" = ${fullUrl},
          "imageUrls" = ${imageUrlsJson}::jsonb
      WHERE id = ${id}
    `;
    console.log('✅ Updated LogEntry with full external URL:', fullUrl);
  } catch (err) {
    console.error("Error updating LogEntry:", err);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
