
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.forecast.count({
    where: {
      regionId: 'eastern-cape'
    }
  });
  console.log('Eastern Cape forecasts:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
