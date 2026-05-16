
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Recent Alert Checks ---');
  const checks = await prisma.alertCheck.findMany({
    take: 20,
    orderBy: { checkedAt: 'desc' },
    include: {
      alert: {
        select: { name: true }
      }
    }
  });

  checks.forEach(c => {
    console.log(`ID: ${c.id}`);
    console.log(`Checked At: ${c.checkedAt.toISOString()}`);
    console.log(`Alert: ${c.alert?.name}`);
    console.log(`Details: ${c.details}`);
    console.log('---');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
