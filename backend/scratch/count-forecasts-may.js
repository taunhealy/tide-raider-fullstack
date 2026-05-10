
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.forecast.count({ where: { date: { gte: new Date('2026-05-01') } } });
  console.log('Forecasts for May 2026:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
