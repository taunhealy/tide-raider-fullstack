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
      console.log("[DEBUG] About to query regions with findMany...");
      console.log("[DEBUG] Prisma client instance:", !!prisma);
      console.log("[DEBUG] Region ID being searched:", regionId);

      try {
        const allRegions = await prisma.region.findMany({
          select: { id: true, name: true },
          take: 20,
        });
        console.log("[DEBUG] Query executed successfully");
        console.log("[DEBUG] Number of regions found:", allRegions.length);
        console.log(
          "[DEBUG] Query result:",
          JSON.stringify(allRegions, null, 2)
        );
        console.log(
          `[getLatestConditions] 🔍 Sample of available regions in database:`,
          allRegions.map((r) => `${r.id} -> "${r.name}"`)
        );
      } catch (queryError: any) {
        console.error("[DEBUG] Query failed with error:", queryError);
        console.error("[DEBUG] Error message:", queryError.message);
        console.error("[DEBUG] Error stack:", queryError.stack);
      }
    }
  }

  if (!region) {
    console.error(`[getLatestConditions] ❌ Invalid region ID: ${regionId}`);
    throw new Error(`Invalid region ID: ${regionId}`);
  }

  const today = getTodayDate();

  // Check for existing forecast (prefer WINDFINDER source, fallback to any)
  console.log(
    `[getLatestConditions] 🔍 Querying forecast for regionId: ${region.id}, date: ${today.toISOString()}`
  );
  const existingForecast = await prisma.forecast.findFirst({
    where: {
      date: today,
      regionId: region.id,
      source: "WINDFINDER", // Prefer WINDFINDER source
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
    const scrapedForecasts = await scraperA(
      regionConfig.sourceA.url,
      configRegionId
    );

    if (!scrapedForecasts || scrapedForecasts.length === 0) {
      throw new Error(`Scraper returned empty array for ${region.id}`);
    }

    console.log(
      `[getLatestConditions] 📊 Scraped ${scrapedForecasts.length} forecast(s), storing in database...`
    );

    // Store all scraped forecasts (today, tomorrow, and day after tomorrow)
    let storedTodayForecast = null;

    for (const scrapedForecast of scrapedForecasts) {
      // Strip time from date
      scrapedForecast.date.setUTCHours(0, 0, 0, 0);

      console.log(
        `[getLatestConditions] 💾 Storing forecast for ${region.id} on ${scrapedForecast.date.toISOString().split("T")[0]}`
      );

      // Store in database using the database region.id (not the config's regionId)
      const storedForecast = await prisma.forecast.upsert({
        where: {
          date_regionId_source: {
            date: scrapedForecast.date,
            regionId: region.id, // Use database region ID
            source: "WINDFINDER", // Source A is WINDFINDER
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
          source: "WINDFINDER", // Source A is WINDFINDER
          windSpeed: scrapedForecast.windSpeed,
          windDirection: scrapedForecast.windDirection,
          swellHeight: scrapedForecast.swellHeight,
          swellPeriod: scrapedForecast.swellPeriod,
          swellDirection: scrapedForecast.swellDirection,
        },
      });

      // Keep track of today's forecast to return
      if (!storedTodayForecast) {
        const forecastDate = new Date(storedForecast.date);
        const todayDate = new Date(today);
        if (
          forecastDate.getDate() === todayDate.getDate() &&
          forecastDate.getMonth() === todayDate.getMonth() &&
          forecastDate.getFullYear() === todayDate.getFullYear()
        ) {
          storedTodayForecast = storedForecast;
        }
      }
    }

    // Return today's forecast for backward compatibility, or first forecast if today not found
    const forecastToReturn = storedTodayForecast || scrapedForecasts[0];

    console.log(
      `[getLatestConditions] ✅ Successfully stored ${scrapedForecasts.length} forecast(s) for ${region.id}`
    );
    return forecastToReturn;
  } catch (error) {
    console.error(
      `[getLatestConditions] ❌ Error scraping/storing forecast for ${region.id}:`,
      error
    );
    throw error;
  }
}
