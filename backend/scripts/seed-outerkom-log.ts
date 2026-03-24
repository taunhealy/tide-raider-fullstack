import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  const beachId = 'outer-kom';
  const regionId = 'western-cape';
  const logDateString = '2025-11-11';
  const targetDate = new Date(logDateString + 'T00:00:00.000Z');

  // Check if forecast already exists
  let forecast = await prisma.forecast.findFirst({
    where: {
      regionId,
      date: targetDate,
      source: 'WINDFINDER'
    }
  });

  const forecastId = forecast ? forecast.id : uuidv4();

  if (!forecast) {
    await prisma.forecast.create({
      data: {
        id: forecastId,
        date: targetDate,
        windDirection: 45, // NE
        windSpeed: 10,
        swellDirection: 270, // W
        swellHeight: 2.0,
        swellPeriod: 14,
        source: 'WINDFINDER',
        region: { connect: { id: regionId } }
      }
    });
    console.log('Created optimal forecast for Outerkom');
  } else {
    console.log('Forecast already exists:', forecast.id);
  }

  const logEntryId = uuidv4();
  const fileName = 'BEST SURF _ OUTERS _ Cape town _ 2025_11_11 #walkonwater #surf #downsouth #westcoast 7-6 screenshot.webp';
  const fullUrl = `https://media.tideraider.com/${encodeURIComponent(fileName)}`;

  await prisma.$executeRaw`
    INSERT INTO "LogEntry" (
      "id", "date", "surferName", "surferEmail", "beachName", "surferRating",
      "comments", "imageUrl", "imageUrls", "videoUrl", "videoPlatform",
      "isPrivate", "isAnonymous", "waveType", "beachId", "regionId", "forecastId"
    ) VALUES (
      ${logEntryId},
      ${targetDate},
      'Tide Raider',
      NULL,
      'Outer Kom',
      5,
      'Epic conditions! S/SW swell lighting up the bowl section with off-shore NE perfection.',
      ${fullUrl},
      ${JSON.stringify([fullUrl])}::jsonb,
      'https://www.youtube.com/watch?v=JKZdKAg-EO0',
      'youtube',
      false,
      false,
      NULL,
      ${beachId},
      ${regionId},
      ${forecastId}
    )
  `;

  console.log('✅ Successfully seeded LogEntry for Outer Kom with Tide Raider logger, 5 stars, optimal conditions, YouTube URL, and correct explicit R2 media image URL!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
