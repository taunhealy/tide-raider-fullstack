import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const dateStr = "2026-03-08T00:00:00.000Z";
  const dateObj = new Date(dateStr);

  const idealForecast = await prisma.forecast.upsert({
    where: {
      date_regionId_source: {
        date: dateObj,
        regionId: 'western-cape',
        source: 'WINDFINDER'
      }
    },
    update: {
      windSpeed: 12,
      windDirection: 135, // SE
      swellHeight: 2.5,
      swellDirection: 225, // SW
      swellPeriod: 14,
    },
    create: {
      date: dateObj,
      regionId: 'western-cape',
      source: 'WINDFINDER',
      windSpeed: 12,
      windDirection: 135,
      swellHeight: 2.5,
      swellDirection: 225,
      swellPeriod: 14,
    }
  });

  console.log('✅ Upserted Forecast:', idealForecast.id);

  const id = crypto.randomUUID();
  const imageUrl = "BEST SURF _ DUNES (P2) _ Session 2026 03 08 #walkonwater #surf #westcoast #capetown #_) 0-18 screenshot.webp";
  const imageUrlsJson = JSON.stringify([imageUrl]);

  try {
    // We use raw SQL because the Prisma schema might be ahead of the current DB schema tracking hiddenGems.
    await prisma.$executeRaw`
      INSERT INTO "LogEntry" (
        "id", "date", "surferName", "beachName", "beachId", "regionId", 
        "surferRating", "comments", "imageUrls", "imageUrl", "forecastId", 
        "isAnonymous", "isPrivate"
      ) VALUES (
        ${id}, ${dateObj}, 'Tide Raider', 'Dunes', 'dunes', 'western-cape', 
        5, 'BEST SURF _ DUNES (P2) _ Session 2026 03 08 #walkonwater #surf #westcoast #capetown #_', 
        ${imageUrlsJson}::jsonb, ${imageUrl}, ${idealForecast.id}, false, false
      )
    `;
    console.log('✅ Created Custom LogEntry for Dunes:', id);
  } catch (err) {
    console.error("Error inserting LogEntry:", err);
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
