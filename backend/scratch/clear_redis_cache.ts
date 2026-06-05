import "../src/setup";
import { redis } from "../src/lib/redis";

async function clearCache() {
  console.log("🔍 Clearing Redis Cache...");
  if (!redis) {
    console.error("❌ Redis client not available");
    return;
  }
  try {
    // We can run flushdb if supported or clear keys matching map-data*
    // Upstash Redis client has flushdb method. Let's try it.
    if (typeof (redis as any).flushdb === 'function') {
      const res = await (redis as any).flushdb();
      console.log(`✅ Redis flushed successfully:`, res);
    } else {
      console.log("flushdb is not a function on redis wrapper, using flushall or direct flush");
      // Let's print all properties on redis
      console.log("Redis keys/methods:", Object.keys(redis));
    }
  } catch (error) {
    console.error("❌ Error flushing redis:", error);
  }
}

clearCache().then(() => process.exit(0));
