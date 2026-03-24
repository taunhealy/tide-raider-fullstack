import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  const countryId = 'australia';
  const regionId = 'gold-coast';
  const logDateString = '2026-03-13';
  const targetDate = new Date(logDateString + 'T00:00:00.000Z');

  // Insert Country using raw SQL if not exists
  await prisma.$executeRaw`
    INSERT INTO "Country" ("id", "name")
    VALUES (${countryId}, 'Australia')
    ON CONFLICT ("id") DO NOTHING;
  `;

  // Insert Region using raw SQL if not exists
  await prisma.$executeRaw`
    INSERT INTO "Region" ("id", "name", "countryId")
    VALUES (${regionId}, 'Gold Coast', ${countryId})
    ON CONFLICT ("id") DO NOTHING;
  `;

  let forecast = await prisma.forecast.findFirst({
    where: {
      regionId,
      date: targetDate,
      source: 'WINDFINDER'
    }
  });

  const forecastId = forecast ? forecast.id : uuidv4();

  if (!forecast) {
    // Generate an optimal forecast for Kirra (SE swell, S/SE wind)
    await prisma.forecast.create({
      data: {
        id: forecastId,
        date: targetDate,
        windDirection: 180, // S
        windSpeed: 15,
        swellDirection: 135, // SE
        swellHeight: 3.0,
        swellPeriod: 14,
        source: 'WINDFINDER',
        region: { connect: { id: regionId } }
      }
    });
    console.log('Created optimal forecast for Kirra, Gold Coast');
  }

  const logEntryId = uuidv4();
  const fileName = 'Kirra Turns On for A Day _ Pumping Conditions March 13 _ Raw Surf Files 0-13 screenshot.webp';
  const fullUrl = `https://media.tideraider.com/${encodeURIComponent(fileName)}`;

  // Use raw SQL to bypass hiddenGemId Prisma schema issue
  await prisma.$executeRaw`
    INSERT INTO "LogEntry" (
      "id", "date", "surferName", "surferEmail", "beachName", "surferRating",
      "comments", "imageUrl", "imageUrls", "videoUrl", "videoPlatform",
      "isPrivate", "isAnonymous", "waveType", "beachId", "regionId", "forecastId"
    ) VALUES (
      ${logEntryId},
      ${targetDate},
      'Anonymous',
      NULL,
      'Kirra',
      0,
      'Epic day at Kirra!\n\n🎥 Footage by rumo.jpg',
      ${fullUrl},
      ${JSON.stringify([fullUrl])}::jsonb,
      'https://www.youtube.com/watch?v=Sf4e-qGHbf0',
      'youtube',
      false,
      true,
      NULL,
      NULL,
      ${regionId},
      ${forecastId}
    )
  `;

  console.log('✅ Successfully seeded LogEntry for Kirra with Anonymous logger, March 13 2026, YouTube URL, rumo.jpg credit, and R2 media image URL!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
