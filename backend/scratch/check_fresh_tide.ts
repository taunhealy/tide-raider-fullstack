import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const forecasts = await prisma.forecast.findMany({
    where: {
      regionId: 'western-cape',
      date: {
        gte: new Date(new Date().setHours(0,0,0,0))
      }
    },
    select: { tide: true, timeSlot: true, date: true },
    orderBy: { date: 'asc' }
  });

  console.log('Western Cape Tide Values (Next 10 days):');
  console.log(forecasts.map(f => `${f.date.toISOString().split('T')[0]} ${f.timeSlot}: ${f.tide}`).join('\n'));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
