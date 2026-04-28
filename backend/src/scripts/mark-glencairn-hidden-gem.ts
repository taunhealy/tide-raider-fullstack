import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: [] });

async function main() {
  const beach = await prisma.beach.findFirst({
    where: { name: { contains: 'Glencairn', mode: 'insensitive' } }
  });

  if (!beach) {
    console.log("Beach 'Glencairn' not found");
    return;
  }

  await prisma.beach.update({
    where: { id: beach.id },
    data: { isHiddenGem: true }
  });

  console.log(`✅ Updated beach '${beach.name}' (ID: ${beach.id}) to be a Hidden Gem.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
