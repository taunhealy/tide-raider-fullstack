
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const beachCount = await prisma.beach.count();
  console.log(`Total beaches in DB: ${beachCount}`);

  const regionCount = await prisma.region.count();
  console.log(`Total regions in DB: ${regionCount}`);

  const regionsWithBeaches = await prisma.region.findMany({
    include: {
      _count: {
        select: { beaches: true }
      }
    }
  });

  console.log("\nBeaches per Region:");
  regionsWithBeaches
    .filter(r => r._count.beaches > 0)
    .forEach(r => {
      console.log(` - ${r.name} (${r.id}): ${r._count.beaches}`);
    });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
