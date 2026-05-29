import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Checking intelligence reports in DB...");
  try {
    const totalReports = await prisma.intelligenceReport.count();
    console.log(`Total IntelligenceReport records in DB: ${totalReports}`);

    const recentReports = await prisma.intelligenceReport.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
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

    console.log("\nMost recent AI reports in DB:");
    recentReports.forEach(r => {
      console.log(`- ID: ${r.id}`);
      console.log(`  Beach: ${r.beach?.name} (${r.beach?.id}), Region: ${r.beach?.regionId}`);
      console.log(`  CreatedAt: ${r.createdAt}`);
      console.log(`  Category: ${r.category}, Source: ${r.source}`);
    });

  } catch (e: any) {
    console.error("Error querying DB:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
