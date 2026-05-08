import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const beachId = 'llandudno';
  const beach = await prisma.beach.findUnique({ where: { id: beachId } });
  
  if (!beach) {
    console.error('Beach not found');
    return;
  }

  // Use raw query or cast to any to see data if types are stale
  const forecasts = await (prisma.forecast as any).findMany({
    where: {
      regionId: beach.regionId,
      date: {
        gte: new Date('2026-05-08T00:00:00Z'),
        lte: new Date('2026-05-15T00:00:00Z')
      },
      timeSlot: 'NOON'
    },
    orderBy: { date: 'asc' }
  });

  console.log('Llandudno Forecast Data (Noon Snapshots):');
  forecasts.forEach((f: any) => {
    console.log(`[${f.date.toISOString().split('T')[0]}] ${f.source}: S1: ${f.swellHeight}m, S2: ${f.swellHeight2}m, S3: ${f.swellHeight3}m, Energy: ${f.swellEnergy}kJ`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
