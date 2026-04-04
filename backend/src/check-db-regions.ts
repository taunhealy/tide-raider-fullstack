import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 50) + "...");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkRegions() {
  try {
    console.log("Connecting to database...");
    const regions = await prisma.region.findMany({
      include: {
        country: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Found ${regions.length} regions.`);
    
    const bali = regions.find(r => r.id.toLowerCase() === 'bali' || r.name.toLowerCase().includes('bali'));
    if (bali) {
      console.log("\n✅ Bali region found!");
      console.log(JSON.stringify(bali, null, 2));
    } else {
      console.log("\n❌ Bali region NOT found!");
    }

    const saCount = regions.filter(r => r.country?.name === 'South Africa').length;
    console.log(`\nSouth African regions: ${saCount}`);
    
    const otherRegions = regions.filter(r => r.country?.name !== 'South Africa');
    console.log(`Other regions: ${otherRegions.length}`);
    if (otherRegions.length > 0) {
      console.log("Samples of other regions:");
      otherRegions.slice(0, 10).forEach(r => console.log(`  - ${r.name} (ID: ${r.id}, Country: ${r.country?.name})`));
    }

  } catch (error) {
    console.error("Error checking regions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRegions();
