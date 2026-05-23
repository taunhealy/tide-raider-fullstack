import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ids = ["kribi", "grosse-bucht", "cato", "shela-beach", "madirokely", "playa-de-estoril"];
  const beaches = await prisma.beach.findMany({
    where: {
      id: { in: ids }
    }
  });
  console.log(`Found ${beaches.length} out of ${ids.length} new gems in database:`);
  for (const b of beaches) {
    console.log(`- ${b.name} (${b.id}) - region: ${b.regionId}, country: ${b.countryId}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
