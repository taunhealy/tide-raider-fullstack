import path from "path";
import dotenv from "dotenv";
import { existsSync } from "fs";

// Load environment variables immediately
// .env.local has highest priority for local development
const envLocalPath = path.join(process.cwd(), ".env.local");
const envPath = path.join(process.cwd(), ".env");

if (existsSync(envLocalPath)) {
  console.log(`[setup] ⚙️ Loading overrides from .env.local...`);
  dotenv.config({ path: envLocalPath, override: true });
} else {
  console.log(`[setup] ⚙️ No .env.local found, using defaults from .env...`);
}
dotenv.config({ path: envPath });

console.log(`[setup] 🚀 DATABASE_URL check: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + "..." : "NOT SET"}`);
