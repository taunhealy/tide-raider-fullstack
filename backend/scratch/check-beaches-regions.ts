import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Checking if any reports have null beach or are missing regionId...");
  const reports = await prisma.intelligenceReport.findMany({
    include: {
      beach: {
        select: {
          name: true,
          id: true,
          regionId: true,
          countryId: true,
          continent: true
        }
      }
    }
  });

  const nullBeach = reports.filter(r => !r.beach);
  const missingRegion = reports.filter(r => r.beach && !r.beach.regionId);

  console.log(`Total reports: ${reports.length}`);
  console.log(`Reports with null beach: ${nullBeach.length}`);
  console.log(`Reports with missing regionId: ${missingRegion.length}`);

  if (reports.length > 0) {
    console.log("Sample report structure:", JSON.stringify(reports[0], null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
