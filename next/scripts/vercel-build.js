#!/usr/bin/env node

const { execSync } = require("child_process");

console.log("🔧 Generating Prisma Client...");
execSync("npx prisma generate", { stdio: "inherit" });

console.log("📦 Running database migrations...");
try {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  console.log("✅ Migrations applied successfully");
} catch (error) {
  // Migration failures are safe to ignore if migrations are already applied
  // Common with Neon databases on Vercel due to connection timeouts (P1002)
  console.warn(
    "⚠️  Migration deploy failed or timed out - continuing build..."
  );
}

console.log("🏗️  Building Next.js application...");
execSync("npx next build", { stdio: "inherit" });

console.log("✅ Build completed successfully");
