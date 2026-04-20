import { fetchAllRegionsData } from '../src/services/regionDataService';
import { prisma } from '../src/lib/prisma';

async function forceScrape() {
  console.log('Starting forced Windguru scrape for core regions...');
  const regionsToScrape = [
    "western-cape",
    "eastern-cape",
    "kwazulu-natal",
    "northern-cape",
    "swakopmund",
    "inhambane-province",
    "ponta-do-ouro",
    "madagascar-south",
    "madagascar-west",
    "madagascar-east",
    "mozambique",
    "luanda-province",
    "benguela",
    "bali",
    "waikato",
    "queensland"
  ];
  const maxDays = 7;
  const result = await fetchAllRegionsData(maxDays, regionsToScrape);
  console.log('Scrape result:', JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

forceScrape().catch(console.error);
