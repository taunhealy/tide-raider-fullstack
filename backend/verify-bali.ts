import { PrismaClient } from "@prisma/client";

const DATABASE_URL = "postgresql://postgres.pffssccmdbopnlgjdhwh:SupabaseIsSupafly@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

async function main() {
  const regions = await prisma.region.findMany({
    where: {
      id: {
        in: ['bali', 'western-cape']
      }
    },
    include: {
      country: true
    }
  });
  console.log('Result:', JSON.stringify(regions, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
