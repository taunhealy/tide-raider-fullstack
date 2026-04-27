import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.beachConditionProfile.findMany({
    where: { beachId: 'long-beach' }
  });
  console.log("Profiles for Long Beach:", JSON.stringify(profiles, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
