import { prisma } from '../src/lib/prisma';

async function check() {
  const reports = await prisma.intelligenceReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      beach: {
        select: {
          name: true,
          id: true,
          regionId: true,
          countryId: true,
          continent: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
        }
      }
    }
  });
  console.log(`Reports returned: ${reports.length}`);
  if (reports.length > 0) {
    console.log(`First: ${reports[0].beach.name} (Region: ${reports[0].beach.regionId})`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
