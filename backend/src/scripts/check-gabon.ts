
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
  const regionId = "gabon-coast";
  console.log(`🔍 Checking region: ${regionId}`);
  
  const region = await prisma.region.findUnique({
    where: { id: regionId },
    include: { beaches: true }
  });

  if (!region) {
    console.log("❌ Region NOT FOUND in database.");
  } else {
    console.log(`✅ Region FOUND: ${region.name}`);
    console.log(`🏖️ Beaches found: ${region.beaches.length}`);
    region.beaches.forEach(b => console.log(`   - ${b.name} (${b.id})`));
  }
}

main().finally(() => prisma.$disconnect());
