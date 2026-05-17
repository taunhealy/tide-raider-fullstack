import { PrismaClient } from "@prisma/client";
import { Redis } from "@upstash/redis";

// Read production env variables from next/.env.vercel.prod
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../../next/.env.vercel.prod");
const envContent = fs.readFileSync(envPath, "utf-8");

const env: Record<string, string> = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    // Check if the value has trailing \r
    if (value.endsWith("\r")) {
      value = value.slice(0, -1);
    }
    env[match[1]] = value;
  }
});

// Setup environment for testing
process.env.DATABASE_URL = env["DATABASE_URL"];
process.env.UPSTASH_REDIS_REST_URL = env["UPSTASH_REDIS_REST_URL"];
process.env.UPSTASH_REDIS_REST_TOKEN = env["UPSTASH_REDIS_REST_TOKEN"];

console.log("DATABASE_URL:", JSON.stringify(process.env.DATABASE_URL));
console.log("REDIS_URL:", JSON.stringify(process.env.UPSTASH_REDIS_REST_URL));

async function main() {
  // Test Redis
  console.log("\n--- Testing Redis REST Connection ---");
  const redis = new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL || "").trim(),
    token: (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim(),
  });

  const redisStart = Date.now();
  try {
    const key = "test-key-ping";
    await redis.set(key, "pong", { ex: 5 });
    const val = await redis.get(key);
    console.log(`✅ Redis write/read completed in ${Date.now() - redisStart}ms. Got value:`, val);
  } catch (err) {
    console.error(`❌ Redis failed in ${Date.now() - redisStart}ms:`, err);
  }

  // Test Prisma DB Connection
  console.log("\n--- Testing Prisma/Postgres Connection ---");
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  const dbStart = Date.now();
  try {
    const count = await prisma.beach.count();
    console.log(`✅ DB query (beach.count) completed in ${Date.now() - dbStart}ms. Count:`, count);
    
    const queryStart = Date.now();
    const beaches = await prisma.beach.findMany({
      select: {
        id: true,
        name: true,
        region: { select: { name: true } }
      }
    });
    console.log(`✅ DB query (beach.findMany) completed in ${Date.now() - queryStart}ms. Fetched ${beaches.length} beaches.`);
  } catch (err) {
    console.error(`❌ DB failed in ${Date.now() - dbStart}ms:`, err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => console.error("Unhandled error:", err));
