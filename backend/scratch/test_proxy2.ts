import { prisma } from '../src/lib/prisma';
import { Prisma } from '@prisma/client';

async function test() {
  const whereClause: Prisma.BeachWhereInput = {
    AND: [
      { OR: [ { isHiddenGem: false }, { isHiddenGem: null } ] }
    ]
  };

  const [beaches, hiddenGemCount] = await Promise.all([
    prisma.beach.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
      }
    }),
    prisma.beach.count({
      where: {
        ...whereClause,
        AND: [ { isHiddenGem: true } ]
      }
    })
  ]);

  console.log(`Global beaches fetched: ${beaches.length}`);
}

test().catch(console.error).finally(() => prisma.$disconnect());
