import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Checking all intelligence reports in DB...");
  const reports = await prisma.intelligenceReport.findMany({
    include: {
      beach: {
        select: {
          id: true,
          name: true,
          regionId: true,
          countryId: true,
          continent: true
        }
      },
      user: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  console.log(`Found ${reports.length} reports total:`);
  reports.forEach((r, idx) => {
    if (r.beachId === 'sunset-reef') {
      console.log(`[${idx + 1}] ID: ${r.id}, Date: ${r.date.toISOString().split('T')[0]}, Source: ${r.source}, Duration: ${r.duration}, Content: ${r.content.substring(0, 150)}...`);
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
