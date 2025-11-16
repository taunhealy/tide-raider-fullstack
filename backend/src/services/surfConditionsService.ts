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
  const region = await prisma.region.findUnique({
    where: { id: regionId },
  });

  if (!region) {
    throw new Error(`Invalid region ID: ${regionId}`);
  }

  const today = getTodayDate();

  // Check for existing forecast
  const existingForecast = await prisma.forecastA.findFirst({
    where: {
      date: today,
      regionId: region.id,
    },
  });

  if (existingForecast && !forceRefresh) {
    console.log(`Found existing forecast for ${region.id}`);
    return existingForecast;
  }

  // Scrape new forecast
  const regionConfig = REGION_CONFIGS[region.id];
  if (!regionConfig) {
    console.error(`Missing region configuration for ${region.id}`);
    return null;
  }

  try {
    console.log(
      `Scraping forecast for ${region.id} from ${regionConfig.sourceA.url}`
    );
    const scrapedForecast = await scraperA(regionConfig.sourceA.url, region.id);

    if (!scrapedForecast) {
      throw new Error(`Scraper returned null for ${region.id}`);
    }

    // Strip time from date
    scrapedForecast.date.setUTCHours(0, 0, 0, 0);

    // Store in database
    const storedForecast = await prisma.forecastA.upsert({
      where: {
        date_regionId: {
          date: scrapedForecast.date,
          regionId: scrapedForecast.regionId,
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
        regionId: scrapedForecast.regionId,
        windSpeed: scrapedForecast.windSpeed,
        windDirection: scrapedForecast.windDirection,
        swellHeight: scrapedForecast.swellHeight,
        swellPeriod: scrapedForecast.swellPeriod,
        swellDirection: scrapedForecast.swellDirection,
      },
    });

    return storedForecast;
  } catch (error) {
    console.error(`Error scraping forecast for ${region.id}:`, error);
    throw error;
  }
}
