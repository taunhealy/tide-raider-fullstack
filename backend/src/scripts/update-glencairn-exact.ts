/**
 * Updates the Apr 24 Glencairn log with the exact conditions provided by the user:
 * Wind: 2kts ENE (67.5°)
 * Swell: 0.8m S (180°)
 * Period: 9s
 * Tide: Low
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: [] });

async function main() {
  const logId = '68561cf3-0e31-4252-a3c2-bc04ab70230c';
  const date = new Date('2026-04-24T00:00:00Z');
  
  // Find the forecast linked to this log
  const entry = await prisma.logEntry.findUnique({
    where: { id: logId },
    select: { forecastId: true }
  });

  if (!entry || !entry.forecastId) {
    console.error("Log entry or linked forecast not found");
    return;
  }

  // Update the forecast record
  await prisma.forecast.update({
    where: { id: entry.forecastId },
    data: {
      windSpeed: 2,
      windDirection: 67.5, // ENE
      swellHeight: 0.8,
      swellPeriod: 9,
      swellDirection: 180, // S
      tide: "Low"
    }
  });
  
  console.log(`✅ Updated forecast ${entry.forecastId} with exact user conditions:`);
  console.log(`   Wind: 2kts ENE | Swell: 0.8m S | Period: 9s | Tide: Low`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
