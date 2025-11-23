
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to DB...");
  try {
    await prisma.$connect();
    console.log("✅ Connected successfully");
    const count = await prisma.region.count();
    console.log(`Region count: ${count}`);
  } catch (e) {
    console.error("❌ Connection failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
