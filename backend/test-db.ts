import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import path from "path";

const DATABASE_URL = "postgresql://postgres.pffssccmdbopnlgjdhwh:SupabaseIsSupafly@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function main() {
  console.log("Testing database connection...");
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  });
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Connection successful:", result);
  } catch (error) {
    console.error("❌ Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
