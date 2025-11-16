import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function transformRegionToId(regionName: string): string {
  return regionName.toLowerCase().replace(/\s+/g, "-");
}

async function main() {
  try {
    console.log("🌱 Starting minimal seed...");

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


    // 2. Create all countries needed
    console.log("2. Creating countries...");
    const countries = [
      { id: "za", name: "South Africa", continentId: "AF" },
      { id: "na", name: "Namibia", continentId: "AF" },
      { id: "mz", name: "Mozambique", continentId: "AF" },
      { id: "mg", name: "Madagascar", continentId: "AF" },
      { id: "ao", name: "Angola", continentId: "AF" },
      { id: "ga", name: "Gabon", continentId: "AF" },
      { id: "lr", name: "Liberia", continentId: "AF" },
      { id: "id", name: "Indonesia", continentId: "AS" },
      { id: "cr", name: "Costa Rica", continentId: "NA" },
      { id: "au", name: "Australia", continentId: "OC" },
      { id: "nz", name: "New Zealand", continentId: "OC" },
      { id: "sv", name: "El Salvador", continentId: "NA" },
      { id: "pe", name: "Peru", continentId: "SA" },
      { id: "es", name: "Spain", continentId: "EU" },
      { id: "us", name: "United States", continentId: "NA" },
      { id: "gb", name: "United Kingdom", continentId: "EU" },
      { id: "fo", name: "Faroe Islands", continentId: "EU" },
      { id: "ma", name: "Morocco", continentId: "AF" },
      { id: "sn", name: "Senegal", continentId: "AF" },
      { id: "yt", name: "Mayotte", continentId: "AF" },
      { id: "zm", name: "Zambia", continentId: "AF" },
    ];

    for (const country of countries) {
      await prisma.country.upsert({
        where: { id: country.id },
        update: {},
        create: country,
      });
    }
    console.log(`✓ Created ${countries.length} countries`);

    // 3. Create all regions from REGION_CONFIGS
    console.log("3. Creating regions...");
    const regions = [
      // South Africa
      { id: "western-cape", name: "Western Cape", countryId: "za" },
      { id: "eastern-cape", name: "Eastern Cape", countryId: "za" },
      { id: "kwazulu-natal", name: "KwaZulu-Natal", countryId: "za" },
      { id: "northern-cape", name: "Northern Cape", countryId: "za" },
      // Namibia
      { id: "swakopmund", name: "Swakopmund", countryId: "na" },
      // Mozambique
      { id: "inhambane-province", name: "Inhambane Province", countryId: "mz" },
      { id: "ponta-do-ouro", name: "Ponta do Ouro", countryId: "mz" },
      { id: "mozambique", name: "Mozambique", countryId: "mz" },
      // Madagascar
      { id: "madagascar-south", name: "Madagascar South", countryId: "mg" },
      { id: "madagascar-west", name: "Madagascar West", countryId: "mg" },
      { id: "madagascar-east", name: "Madagascar East", countryId: "mg" },
      // Angola
      { id: "luanda-province", name: "Luanda Province", countryId: "ao" },
      { id: "benguela", name: "Benguela", countryId: "ao" },
      // Gabon
      { id: "gabon-coast", name: "Gabon Coast", countryId: "ga" },
      // Liberia
      { id: "liberia", name: "Liberia", countryId: "lr" },
      // Indonesia
      { id: "bali", name: "Bali", countryId: "id" },
      // Costa Rica
      { id: "puntarenas-province", name: "Puntarenas Province", countryId: "cr" },
      // Australia
      { id: "queensland", name: "Queensland", countryId: "au" },
      { id: "new-south-wales", name: "New South Wales", countryId: "au" },
      // New Zealand
      { id: "waikato", name: "Waikato", countryId: "nz" },
      // El Salvador
      { id: "san-salvador", name: "San Salvador", countryId: "sv" },
      { id: "costa-del-balsamo", name: "Costa del Balsamo", countryId: "sv" },
      // Peru
      { id: "chicama", name: "Chicama", countryId: "pe" },
      // Spain
      { id: "andalucia", name: "Andalucia", countryId: "es" },
      { id: "granada", name: "Granada", countryId: "es" },
      // USA
      { id: "california", name: "California", countryId: "us" },
      // UK
      { id: "scotland", name: "Scotland", countryId: "gb" },
      // Faroe Islands
      { id: "suðuroy", name: "Suðuroy", countryId: "fo" },
      { id: "streymoy", name: "Streymoy", countryId: "fo" },
      { id: "sandoy", name: "Sandoy", countryId: "fo" },
      // Morocco
      { id: "central-morocco", name: "Central Morocco", countryId: "ma" },
      { id: "morocco", name: "Morocco", countryId: "ma" },
      // Senegal
      { id: "dakar", name: "Dakar", countryId: "sn" },
      // Mayotte
      { id: "mayotte", name: "Mayotte", countryId: "yt" },
      // Zambia
      { id: "zambia", name: "Zambia", countryId: "zm" },
    ];

    for (const region of regions) {
      await prisma.region.upsert({
        where: { id: region.id },
        update: {},
        create: {
          id: region.id,
          name: region.name,
          countryId: region.countryId,
        },
      });
      console.log(`✓ Created/updated region: ${region.name} (${region.id})`);
    }

    console.log("✅ Minimal seed completed successfully!");
  } catch (error) {
    console.error("❌ Error during seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

