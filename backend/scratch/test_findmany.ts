import { prisma } from '../src/lib/prisma';
import crypto from 'crypto';

async function test() {
  const whereClause = { id: { not: "non-existent" } }; // Match all
  const targetDate = new Date();
  targetDate.setUTCHours(0, 0, 0, 0);

  console.log("Fetching global beaches...");
  const beaches = await prisma.beach.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      coordinates: true
    }
  });

  console.log(`Global beaches: ${beaches.length}`);
}

test().catch(console.error).finally(() => prisma.$disconnect());
