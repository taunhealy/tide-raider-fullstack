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
    console.log(`[${idx + 1}] ID: ${r.id}, Date: ${r.date.toISOString().split('T')[0]}, Beach: ${r.beach?.name} (Region: ${r.beach?.regionId}), User: ${r.user?.name || 'NULL'} (ID: ${r.userId})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
