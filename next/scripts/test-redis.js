const { Redis } = require("@upstash/redis");
require("dotenv").config({ path: ".env" });

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

console.log("URL from process.env:", JSON.stringify(url));
console.log("Token from process.env:", JSON.stringify(token));

const cleanUrl = (url || "").replace(/^"|"$/g, "").trim();
const cleanToken = (token || "").replace(/^"|"$/g, "").trim();

console.log("Cleaned URL:", JSON.stringify(cleanUrl));
console.log("Cleaned Token:", JSON.stringify(cleanToken));

const redis = new Redis({
  url: cleanUrl,
  token: cleanToken,
});

async function run() {
  console.log("Sending ping/get to Upstash Redis...");
  try {
    const start = Date.now();
    const res = await redis.get("test-key-tide-raider");
    console.log(`Response received in ${Date.now() - start}ms:`, res);
    
    console.log("Setting key...");
    const setRes = await redis.set("test-key-tide-raider", "hello-" + Date.now(), { ex: 60 });
    console.log("Set response:", setRes);
  } catch (err) {
    console.error("Redis error details:", err);
  }
}

run();
