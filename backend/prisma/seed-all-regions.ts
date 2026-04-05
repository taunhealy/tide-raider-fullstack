import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function transformRegionToId(regionName: string): string {
  return regionName.toLowerCase().replace(/\s+/g, "-");
}

// Map region IDs to their country and continent
const REGION_MAPPINGS: Record<
  string,
  { name: string; countryId: string; continentId: string }
> = {
  // South Africa
  "western-cape": { name: "Western Cape", countryId: "za", continentId: "AF" },
  "eastern-cape": { name: "Eastern Cape", countryId: "za", continentId: "AF" },
  "kwazulu-natal": { name: "KwaZulu-Natal", countryId: "za", continentId: "AF" },
  "northern-cape": { name: "Northern Cape", countryId: "za", continentId: "AF" },
  // Namibia
  swakopmund: { name: "Swakopmund", countryId: "na", continentId: "AF" },
  // Mozambique
  "inhambane-province": {
    name: "Inhambane Province",
    countryId: "mz",
    continentId: "AF",
  },
  "ponta-do-ouro": { name: "Ponta do Ouro", countryId: "mz", continentId: "AF" },
  mozambique: { name: "Mozambique", countryId: "mz", continentId: "AF" },
  // Madagascar
  "madagascar-south": {
    name: "Madagascar South",
    countryId: "mg",
    continentId: "AF",
  },
  "madagascar-west": {
    name: "Madagascar West",
    countryId: "mg",
    continentId: "AF",
  },
  "madagascar-east": {
    name: "Madagascar East",
    countryId: "mg",
    continentId: "AF",
  },
  // Angola
  "luanda-province": { name: "Luanda Province", countryId: "ao", continentId: "AF" },
  benguela: { name: "Benguela", countryId: "ao", continentId: "AF" },
  // Gabon
  "gabon-coast": { name: "Gabon Coast", countryId: "ga", continentId: "AF" },
  // Liberia
  liberia: { name: "Liberia", countryId: "lr", continentId: "AF" },
  // Indonesia
  bali: { name: "Bali", countryId: "id", continentId: "AS" },
  // Costa Rica
  "puntarenas-province": {
    name: "Puntarenas Province",
    countryId: "cr",
    continentId: "NA",
  },
  // Australia
  queensland: { name: "Queensland", countryId: "au", continentId: "OC" },
  "sunshine-coast": { name: "Sunshine Coast", countryId: "au", continentId: "OC" },
  "gold-coast": { name: "Gold Coast", countryId: "au", continentId: "OC" },
  "new-south-wales": {
    name: "New South Wales",
    countryId: "au",
    continentId: "OC",
  },
  "nsw-north-coast": { name: "NSW North Coast", countryId: "au", continentId: "OC" },
  // New Zealand
  waikato: { name: "Waikato", countryId: "nz", continentId: "OC" },
  "bay-of-plenty": { name: "Bay Of Plenty", countryId: "nz", continentId: "OC" },
  // El Salvador
  "san-salvador": { name: "San Salvador", countryId: "sv", continentId: "NA" },
  "costa-del-balsamo": {
    name: "Costa del Balsamo",
    countryId: "sv",
    continentId: "NA",
  },
  // Peru
  chicama: { name: "Chicama", countryId: "pe", continentId: "SA" },
  // Spain
  andalucia: { name: "Andalucia", countryId: "es", continentId: "EU" },
  granada: { name: "Granada", countryId: "es", continentId: "EU" },
  // USA
  california: { name: "California", countryId: "us", continentId: "NA" },
  // UK
  scotland: { name: "Scotland", countryId: "gb", continentId: "EU" },
  // Faroe Islands
  suðuroy: { name: "Suðuroy", countryId: "fo", continentId: "EU" },
  streymoy: { name: "Streymoy", countryId: "fo", continentId: "EU" },
  sandoy: { name: "Sandoy", countryId: "fo", continentId: "EU" },
  // Morocco
  "central-morocco": { name: "Central Morocco", countryId: "ma", continentId: "AF" },
  morocco: { name: "Morocco", countryId: "ma", continentId: "AF" },
  // Senegal
  dakar: { name: "Dakar", countryId: "sn", continentId: "AF" },
  // Mayotte
  mayotte: { name: "Mayotte", countryId: "yt", continentId: "AF" },
  // Zambia
  zambia: { name: "Zambia", countryId: "zm", continentId: "AF" },
};

async function main() {
  try {
    console.log("🌱 Starting comprehensive seed for all regions...");

    // 1. Create continents
    console.log("1. Creating continents...");
    const continents = [
      { id: "AF", name: "Africa" },
      { id: "EU", name: "Europe" },
      { id: "AS", name: "Asia" },
      { id: "NA", name: "North America" },
      { id: "SA", name: "South America" },
      { id: "OC", name: "Oceania" },
      { id: "AN", name: "Antarctica" },
    ];

    for (const continent of continents) {
      await prisma.continent.upsert({
        where: { id: continent.id },
        update: {},
        create: continent,
      });
    }
    console.log("✓ Continents created");

    // 2. Create countries
    console.log("2. Creating countries...");
    const countryMappings: Record<string, { id: string; name: string; continentId: string }> = {
      za: { id: "za", name: "South Africa", continentId: "AF" },
      na: { id: "na", name: "Namibia", continentId: "AF" },
      mz: { id: "mz", name: "Mozambique", continentId: "AF" },
      mg: { id: "mg", name: "Madagascar", continentId: "AF" },
      ao: { id: "ao", name: "Angola", continentId: "AF" },
      ga: { id: "ga", name: "Gabon", continentId: "AF" },
      lr: { id: "lr", name: "Liberia", continentId: "AF" },
      id: { id: "id", name: "Indonesia", continentId: "AS" },
      cr: { id: "cr", name: "Costa Rica", continentId: "NA" },
      au: { id: "au", name: "Australia", continentId: "OC" },
      nz: { id: "nz", name: "New Zealand", continentId: "OC" },
      sv: { id: "sv", name: "El Salvador", continentId: "NA" },
      pe: { id: "pe", name: "Peru", continentId: "SA" },
      es: { id: "es", name: "Spain", continentId: "EU" },
      us: { id: "us", name: "United States", continentId: "NA" },
      gb: { id: "gb", name: "United Kingdom", continentId: "EU" },
      fo: { id: "fo", name: "Faroe Islands", continentId: "EU" },
      ma: { id: "ma", name: "Morocco", continentId: "AF" },
      sn: { id: "sn", name: "Senegal", continentId: "AF" },
      yt: { id: "yt", name: "Mayotte", continentId: "AF" },
      zm: { id: "zm", name: "Zambia", continentId: "AF" },
    };

    for (const country of Object.values(countryMappings)) {
      await prisma.country.upsert({
        where: { id: country.id },
        update: {},
        create: country,
      });
    }
    console.log(`✓ Created ${Object.keys(countryMappings).length} countries`);

    // 3. Create all regions
    console.log("3. Creating regions...");
    let createdCount = 0;
    for (const [regionId, mapping] of Object.entries(REGION_MAPPINGS)) {
      await prisma.region.upsert({
        where: { id: regionId },
        update: {},
        create: {
          id: regionId,
          name: mapping.name,
          countryId: mapping.countryId,
          continent: mapping.continentId,
        },
      });
      createdCount++;
      console.log(`✓ Created/updated region: ${mapping.name} (${regionId})`);
    }

    console.log(`✅ Seed completed successfully! Created ${createdCount} regions.`);
  } catch (error) {
    console.error("❌ Error during seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

