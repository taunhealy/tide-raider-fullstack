#!/usr/bin/env node

const { execSync } = require("child_process");

console.log("🔧 Generating Prisma Client...");
execSync("npx prisma generate", { stdio: "inherit" });

console.log("🏗️  Building Next.js application...");
execSync("npx next build", { stdio: "inherit" });

console.log("✅ Build completed successfully");
console.log("");
console.log("📝 Note: Run migrations separately when needed:");
console.log("   npx prisma migrate deploy");
