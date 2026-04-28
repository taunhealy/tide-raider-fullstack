import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const forecasts = await prisma.forecast.findMany({
    where: {
      tide: {
        contains: 'm'
      }
    }
  });

  console.log(`Found ${forecasts.length} forecasts with 'm' in tide.`);

  let updatedCount = 0;
  for (const f of forecasts) {
    if (!f.tide) continue;
    
    let newTide = f.tide;
    
    // Pattern: "Low (10m)" -> "Low"
    if (f.tide.includes('(') && f.tide.includes('m)')) {
      newTide = f.tide.split(' (')[0];
    } 
    // Pattern: "10m" -> null or ""
    else if (/^\d+m$/.test(f.tide)) {
      newTide = null;
    }
    
    if (newTide !== f.tide) {
      await prisma.forecast.update({
        where: { id: f.id },
        data: { tide: newTide }
      });
      updatedCount++;
    }
  }

  console.log(`✅ Updated ${updatedCount} forecasts.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
