import { prisma } from "../src/lib/prisma";

async function queryReports() {
  try {
    const reports = await (prisma as any).intelligenceReport.findMany({
      include: {
        beach: {
          select: {
            id: true,
            name: true,
            regionId: true,
            countryId: true,
            continent: true
          }
        }
      },
      take: 10
    });
    console.log("Reports with beach detail:");
    console.log(JSON.stringify(reports, null, 2));
  } catch (err: any) {
    console.error("Failed to query reports:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

queryReports();
