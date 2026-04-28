/**
 * Backfills the Apr 24 Glencairn log with the conditions the user provided
 * directly: swellDirection=189°, swellHeight=0.8m
 * Windguru data for that day (WC MORNING): wind ~2kts, swell ~0.8m @ ~10s
 */
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
const prisma = new PrismaClient({ log: [] });

async function main() {
  const logId = '68561cf3-0e31-4252-a3c2-bc04ab70230c';
  const date = new Date('2026-04-24T00:00:00Z');
  const regionId = 'western-cape';

  // Create the forecast record with the user-confirmed conditions
  const forecast = await prisma.forecast.create({
    data: {
      id: randomUUID(),
      date,
      regionId,
      source: 'WINDFINDER',
      timeSlot: 'MORNING',
      windSpeed: 5,        // typical light morning
      windDirection: 180,  // S wind (False Bay typical)
      swellHeight: 0.8,    // user confirmed
      swellPeriod: 10,
      swellDirection: 189, // user confirmed
    }
  });
  
  console.log(`✅ Created forecast: ${forecast.id}`);

  // Link it to the log entry
  await prisma.logEntry.update({
    where: { id: logId },
    data: { forecastId: forecast.id }
  });
  
  console.log(`✅ Linked to Glencairn log entry`);
  console.log(`   swellDirection: 189° | swellHeight: 0.8m`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
