import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const prisma = new PrismaClient();

async function listSARegions() {
  try {
    const regions = await prisma.region.findMany({
      where: {
        country: {
          name: 'South Africa'
        }
      },
      include: {
        _count: {
          select: { beaches: true }
        }
      }
    });

    console.log(`Found ${regions.length} South African regions:`);
    regions.forEach(r => {
      console.log(`- ${r.name} (ID: ${r.id}) - ${r._count.beaches} beaches`);
    });

    // Also check for western-cape specifically
    const wc = await prisma.region.findUnique({
      where: { id: 'western-cape' }
    });
    if (wc) {
        console.log(`\nWestern Cape found by ID: ${wc.id}`);
    } else {
        console.log(`\nWestern Cape NOT found by ID: western-cape`);
    }

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

listSARegions();
