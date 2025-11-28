import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    console.log("Attempting to connect to database...");
    await prisma.$connect();
    console.log("✅ Connected successfully!");
    
    const count = await prisma.beach.count();
    console.log(`Found ${count} beaches.`);
    
  } catch (e) {
    console.error("❌ Connection failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
