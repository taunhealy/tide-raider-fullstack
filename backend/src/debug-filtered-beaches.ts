import { PrismaClient, Prisma } from "@prisma/client";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const prisma = new PrismaClient();

async function debugQuery() {
  try {
    // Exact params from the user's report
    const query = {
        timeSlot: 'MORNING',
        forecastDate: '2026-05-05',
        regionId: 'western-cape'
    };

    const regionIdParam = query.regionId.toLowerCase();
    const isPremium = false; 
    
    // Resolve region
    let region = await prisma.region.findUnique({
      where: { id: regionIdParam },
    });

    if (!region) {
      console.log("Region not found by ID, trying slug logic...");
      const nameFromSlug = regionIdParam
            .split("-")
            .map(
              (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");

      region = await prisma.region.findFirst({
        where: {
          OR: [
            { id: regionIdParam },
            { name: { equals: nameFromSlug, mode: "insensitive" } },
            { name: { equals: regionIdParam, mode: "insensitive" } },
            { name: { contains: regionIdParam, mode: "insensitive" } },
            { name: { contains: nameFromSlug, mode: "insensitive" } },
          ],
        },
      });
    }

    if (!region) {
      console.log("Region still not found");
      return;
    }

    console.log(`Resolved region: ${region.name} (${region.id})`);

    const showHiddenGems = isPremium; 
    const showRegular = true; 

    const typeFilters: any[] = [];
    if (showHiddenGems) {
        if (isPremium) {
            typeFilters.push({ isHiddenGem: true });
        }
    }
    if (showRegular) {
        typeFilters.push({ 
          OR: [
            { isHiddenGem: false },
            { isHiddenGem: null }
          ]
        });
    }

    const whereClause: Prisma.BeachWhereInput = {
      regionId: region.id,
    };

    if (typeFilters.length > 0) {
        whereClause.AND = [
          { OR: typeFilters }
        ];
    } else {
        whereClause.id = "force-zero-results";
    }

    console.log("Where Clause:", JSON.stringify(whereClause, null, 2));

    const beaches = await prisma.beach.findMany({
      where: whereClause,
    });

    console.log(`Found ${beaches.length} beaches.`);

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

debugQuery();
