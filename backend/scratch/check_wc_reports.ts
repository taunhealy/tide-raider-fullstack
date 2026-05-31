import { prisma } from '../src/lib/prisma';

async function check() {
  const reports = await prisma.intelligenceReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      beach: {
        select: { name: true, regionId: true }
      }
    }
  });
  
  const wcReports = reports.filter(r => r.beach?.regionId === 'western-cape');
  console.log(`Total latest 20 reports: ${reports.length}`);
  console.log(`Western Cape reports in latest 20: ${wcReports.length}`);
  for (const r of wcReports) {
    console.log(`- ${r.beach.name} (${r.createdAt})`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
