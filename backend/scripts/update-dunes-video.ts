import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const logEntryId = 'ca12de6f-923d-4175-b58d-36831a6e30b0';
  
  // Use raw SQL to fetch existing comment to avoid hiddenGemId issue
  const logs: any[] = await prisma.$queryRaw`
    SELECT "comments" FROM "LogEntry" WHERE id = ${logEntryId}
  `;

  if (!logs || logs.length === 0) {
    console.error(`Log entry ${logEntryId} not found`);
    return;
  }

  const existingComments = logs[0].comments || '';
  const newComments = existingComments.length > 0
    ? `${existingComments}\n\nVideo credit: cape | doctor`
    : 'Video credit: cape | doctor';

  await prisma.$executeRaw`
    UPDATE "LogEntry"
    SET "surferName" = 'Tide Raider',
        "videoUrl" = 'https://www.youtube.com/watch?v=oeZ596HbhSw',
        "videoPlatform" = 'youtube',
        "comments" = ${newComments}
    WHERE id = ${logEntryId}
  `;

  console.log(`✅ Updated LogEntry ${logEntryId} with Tide Raider author, YouTube link, and credits.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
