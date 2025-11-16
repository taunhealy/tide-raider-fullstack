import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";
import { REGION_CONFIGS } from "../lib/scrapers/scrapeSources";
import { scraperA } from "../lib/scrapers/scraperA";

function getTodayDate() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export async function getLatestConditions(
  regionId: string,
  forceRefresh = false
) {
  // First, try to find region by ID (exact match, case-sensitive)
  console.log(
    `[getLatestConditions] 🔍 Looking up region by ID: "${regionId}"`
  );
  let region = await prisma.region.findUnique({
    where: { id: regionId },
  });

  if (region) {
    console.log(
      `[getLatestConditions] ✅ Region found by ID: ${region.id} (${region.name})`
    );
  } else {
    // Try lowercase version in case there's a case mismatch
    const lowerRegionId = regionId.toLowerCase();
    if (lowerRegionId !== regionId) {
      console.log(
        `[getLatestConditions] 🔍 Trying lowercase ID: "${lowerRegionId}"`
      );
      region = await prisma.region.findUnique({
        where: { id: lowerRegionId },
      });
      if (region) {
        console.log(
          `[getLatestConditions] ✅ Region found by lowercase ID: ${region.id} (${region.name})`
        );
      }
    }
  }

  // If not found by ID, try to find by name (case-insensitive)
  // Handle slug format like "bali" -> "Bali" or "western-cape" -> "Western Cape"
  if (!region) {
    console.log(
      `[getLatestConditions] ⚠️ Region not found by ID, trying name lookup...`
    );
    // Convert slug to title case for name matching
    // "western-cape" -> "Western Cape", "bali" -> "Bali"
    const nameFromSlug = regionId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    console.log(
      `[getLatestConditions] 🔍 Searching for region with name variations:`,
      {
        original: regionId,
        nameFromSlug,
        searchPatterns: [
          `id = "${regionId}"`,
          `name = "${nameFromSlug}" (case-insensitive)`,
          `name contains "${regionId}" (case-insensitive)`,
          `name contains "${nameFromSlug}" (case-insensitive)`,
        ],
      }
    );

    region = await prisma.region.findFirst({
      where: {
        OR: [
          { id: regionId },
          { name: { equals: nameFromSlug, mode: "insensitive" } },
          { name: { equals: regionId, mode: "insensitive" } },
          { name: { contains: regionId, mode: "insensitive" } },
          { name: { contains: nameFromSlug, mode: "insensitive" } },
        ],
      },
    });

    if (region) {
      console.log(
        `[getLatestConditions] ✅ Region found by name: ${region.id} (${region.name})`
      );
    } else {
      // Log available regions for debugging
      const allRegions = await prisma.region.findMany({
        select: { id: true, name: true },
        take: 20,
      });
      console.log(
        `[getLatestConditions] 🔍 Sample of available regions in database:`,
        allRegions.map((r) => `${r.id} -> "${r.name}"`)
      );
    }
  }

  if (!region) {
    console.error(`[getLatestConditions] ❌ Invalid region ID: ${regionId}`);
    throw new Error(`Invalid region ID: ${regionId}`);
  }

  const today = getTodayDate();

  // Check for existing forecast
  console.log(
    `[getLatestConditions] 🔍 Querying forecast for regionId: ${region.id}, date: ${today.toISOString()}`
  );
  const existingForecast = await prisma.forecastA.findFirst({
    where: {
      date: today,
      regionId: region.id,
    },
  });

  console.log(`[getLatestConditions] 📊 Forecast query result:`, {
    found: !!existingForecast,
    regionId: region.id,
    date: today.toISOString(),
    forceRefresh,
  });

  if (existingForecast && !forceRefresh) {
    console.log(
      `[getLatestConditions] ✅ Found existing forecast for ${region.id} (cached)`
    );
    return existingForecast;
  }

  // Scrape new forecast
  // Try to find config by region.id first, then by original regionId (slug format)
  let regionConfig = REGION_CONFIGS[region.id] || REGION_CONFIGS[regionId];

  // If still not found, try slug format variations
  if (!regionConfig) {
    const slugVariations = [
      regionId.toLowerCase(),
      regionId.replace(/\s+/g, "-").toLowerCase(),
      region.name.toLowerCase().replace(/\s+/g, "-"),
    ];

    for (const slug of slugVariations) {
      if (REGION_CONFIGS[slug]) {
        regionConfig = REGION_CONFIGS[slug];
        break;
      }
    }
  }

  if (!regionConfig) {
    console.error(
      `Missing region configuration for ${region.id} (tried: ${region.id}, ${regionId})`
    );
    return null;
  }

  // Use the region.id from database for storing forecast, but use config's regionId for scraping
  const configRegionId = regionConfig.regionId || region.id;

  try {
    console.log(
      `[getLatestConditions] 🌐 Scraping forecast for ${region.id} from ${regionConfig.sourceA.url}`
    );
    const scrapedForecast = await scraperA(
      regionConfig.sourceA.url,
      configRegionId
    );

    if (!scrapedForecast) {
      throw new Error(`Scraper returned null for ${region.id}`);
    }

    // Strip time from date
    scrapedForecast.date.setUTCHours(0, 0, 0, 0);

    console.log(
      `[getLatestConditions] 💾 Storing forecast in database for regionId: ${region.id}`
    );
    // Store in database using the database region.id (not the config's regionId)
    const storedForecast = await prisma.forecastA.upsert({
      where: {
        date_regionId: {
          date: scrapedForecast.date,
          regionId: region.id, // Use database region ID
        },
      },
      update: {
        windSpeed: scrapedForecast.windSpeed,
        windDirection: scrapedForecast.windDirection,
        swellHeight: scrapedForecast.swellHeight,
        swellPeriod: scrapedForecast.swellPeriod,
        swellDirection: scrapedForecast.swellDirection,
      },
      create: {
        id: randomUUID(),
        date: scrapedForecast.date,
        regionId: region.id, // Use database region ID
        windSpeed: scrapedForecast.windSpeed,
        windDirection: scrapedForecast.windDirection,
        swellHeight: scrapedForecast.swellHeight,
        swellPeriod: scrapedForecast.swellPeriod,
        swellDirection: scrapedForecast.swellDirection,
      },
    });

    console.log(
      `[getLatestConditions] ✅ Successfully stored forecast for ${region.id}`
    );
    return storedForecast;
  } catch (error) {
    console.error(
      `[getLatestConditions] ❌ Error scraping/storing forecast for ${region.id}:`,
      error
    );
    throw error;
  }
}
