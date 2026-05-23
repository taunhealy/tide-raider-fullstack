import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("=== Inspecting WINDY Forecast Records ===");
  const forecasts = await prisma.forecast.findMany({
    where: { source: 'WINDY' },
    orderBy: { date: 'asc' }
  });

  console.log(`Found ${forecasts.length} records.`);
  for (const f of forecasts) {
    console.log(`ID: ${f.id} | Date: ${f.date.toISOString()} | Slot: ${f.timeSlot} | Created: ${f.createdAt.toISOString()} | Updated: ${f.updatedAt.toISOString()}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
