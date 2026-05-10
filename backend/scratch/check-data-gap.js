
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const earliest = await prisma.forecast.findFirst({
    where: {
      date: {
        gte: new Date('2026-05-01T00:00:00Z')
      }
    },
    orderBy: {
      date: 'asc'
    }
  });
  if (earliest) {
    console.log('Earliest May 2026 forecast:', earliest.date);
  } else {
    console.log('No forecasts found for May 2026');
  }

  const latestBeforeMay = await prisma.forecast.findFirst({
    where: {
      date: {
        lt: new Date('2026-05-01T00:00:00Z')
      }
    },
    orderBy: {
      date: 'desc'
    }
  });
  if (latestBeforeMay) {
    console.log('Latest forecast before May 2026:', latestBeforeMay.date);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
