import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedLog({
  countryId, countryName, continentId,
  regionId, regionName,
  beachName,
  logDateString,
  optimalConditions,
  surferName,
  isAnonymous,
  comments,
  videoUrl,
  fileName
}: any) {
  const targetDate = new Date(logDateString + 'T00:00:00.000Z');

  // Insert Country
  await prisma.$executeRaw`
    INSERT INTO "Country" ("id", "name", "continentId")
    VALUES (${countryId}, ${countryName}, ${continentId})
    ON CONFLICT ("id") DO NOTHING;
  `;

  // Insert Region
  await prisma.$executeRaw`
    INSERT INTO "Region" ("id", "name", "countryId")
    VALUES (${regionId}, ${regionName}, ${countryId})
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
    await prisma.forecast.create({
      data: {
        id: forecastId,
        date: targetDate,
        windDirection: optimalConditions.windDirection,
        windSpeed: optimalConditions.windSpeed,
        swellDirection: optimalConditions.swellDirection,
        swellHeight: optimalConditions.swellHeight,
        swellPeriod: optimalConditions.swellPeriod,
        source: 'WINDFINDER',
        region: { connect: { id: regionId } }
      }
    });
    console.log(`Created optimal forecast for ${beachName}`);
  }

  const logEntryId = uuidv4();
  const publicUrl = process.env.R2_PUBLIC_URL || 'https://media.tideraider.com';
  const fullUrl = `${publicUrl}/${encodeURIComponent(fileName)}`;

  await prisma.$executeRaw`
    INSERT INTO "LogEntry" (
      "id", "date", "surferName", "surferEmail", "beachName", "surferRating",
      "comments", "imageUrl", "imageUrls", "videoUrl", "videoPlatform",
      "isPrivate", "isAnonymous", "waveType", "beachId", "regionId", "forecastId"
    ) VALUES (
      ${logEntryId},
      ${targetDate},
      ${surferName},
      NULL,
      ${beachName},
      5,
      ${comments},
      ${fullUrl},
      ${JSON.stringify([fullUrl])}::jsonb,
      ${videoUrl || null},
      ${videoUrl ? 'youtube' : null},
      false,
      ${isAnonymous},
      NULL,
      NULL,
      ${regionId},
      ${forecastId}
    )
  `;

  console.log(`✅ Successfully seeded LogEntry for ${beachName}!`);
}

async function main() {
  // Kirra
  await seedLog({
    countryId: 'australia',
    countryName: 'Australia',
    continentId: 'OC',
    regionId: 'gold-coast',
    regionName: 'Gold Coast',
    beachName: 'Kirra',
    logDateString: '2026-03-13',
    optimalConditions: {
      windDirection: 180, // S
      windSpeed: 10,
      swellDirection: 135, // SE
      swellHeight: 3.0,
      swellPeriod: 15
    },
    surferName: 'Anonymous',
    isAnonymous: true,
    comments: 'Kirra, Gold Coast, Australia\n\n🎥 Footage by rumo.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=Sf4e-qGHbf0',
    fileName: 'Kirra Turns On for A Day _ Pumping Conditions March 13 _ Raw Surf Files 0-13 screenshot.webp'
  });

  // Nias
  await seedLog({
    countryId: 'indonesia',
    countryName: 'Indonesia',
    continentId: 'AS',
    regionId: 'sumatra',
    regionName: 'Sumatra',
    beachName: 'Nias (Lagundri Bay)',
    logDateString: '2026-01-25',
    optimalConditions: {
      windDirection: 315, // NW
      windSpeed: 8,
      swellDirection: 200, // SSW
      swellHeight: 2.8,
      swellPeriod: 16
    },
    surferName: 'Anonymous',
    isAnonymous: true,
    comments: 'First Swell of the Season! - NIAS, Indonesia - RAWFILES 25-26/JAN/2026 4K\nFilmed by @jamburaelodgenias\n#LagundriBay #Nias #SurfRawFiles',
    videoUrl: null, // the user did not supply a URL for this one
    fileName: 'First Swell of the Season! - NIAS, Indonesia - RAWFILES 25-26_JAN_2026 4K 0-17 screenshot.webp'
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
