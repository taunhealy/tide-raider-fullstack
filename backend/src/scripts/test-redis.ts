
import "../setup";
import { redis } from "../lib/redis";

async function testRedis() {
  console.log("🔍 Testing Redis Connection...");

  if (!redis) {
    console.error("❌ Failed to get Redis client.");
    process.exit(1);
  }

  try {
    const testKey = "test:connection:" + Date.now();
    const testValue = "Connected Successfully " + new Date().toISOString();

    console.log(`📡 Attempting to SET key: ${testKey}`);
    await redis.set(testKey, testValue);
    
    console.log(`📥 Attempting to GET key: ${testKey}`);
    const result = await redis.get(testKey);

    if (result === testValue) {
      console.log("✅ SUCCESS: Redis connection verified!");
      console.log(`📝 Value retrieved: ${result}`);
    } else {
      console.warn("⚠️ WARNING: Redis returned unexpected result.");
      console.log(`Expected: ${testValue}`);
      console.log(`Received: ${result}`);
    }

    // Cleanup
    await redis.del(testKey);
    console.log("🧹 Cleanup complete.");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR: Redis connection failed!");
    console.error(error);
    process.exit(1);
  }
}

testRedis();
