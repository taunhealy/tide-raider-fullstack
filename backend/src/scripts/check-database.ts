import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.DIRECT_URL,
    },
  },
});

async function main() {
  const continents = await prisma.beach.groupBy({
    by: ['continent'],
    _count: {
      id: true
    }
  });
  console.log("Beaches by continent:");
  console.log(JSON.stringify(continents, null, 2));

  const countries = await prisma.country.findMany({
    select: {
      name: true,
      continentId: true
    }
  });
  console.log("\nCountries in DB:");
  console.log(JSON.stringify(countries, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
