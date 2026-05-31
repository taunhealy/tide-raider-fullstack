import { prisma } from '../src/lib/prisma';

async function check() {
  const reports = await prisma.intelligenceReport.findMany({ take: 5 });
  console.log(`Found ${reports.length} reports in the DB.`);
  for (const r of reports) {
    console.log(`- ID: ${r.id}, Beach: ${r.beachId}, Persona: ${r.persona}, Source: ${r.source}`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
