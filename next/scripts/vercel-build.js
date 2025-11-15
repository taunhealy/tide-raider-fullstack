#!/usr/bin/env node

const { execSync } = require("child_process");

console.log("🔧 Generating Prisma Client...");
try {
  execSync("npx prisma generate", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Failed to generate Prisma Client");
  process.exit(1);
}

console.log("📦 Running database migrations...");
let migrationSucceeded = false;
try {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    maxBuffer: 1024 * 1024 * 10, // 10MB buffer
  });
  console.log("✅ Migrations applied successfully");
  migrationSucceeded = true;
} catch (error) {
  // Check if it's a timeout or connection error (P1002, P1001, etc.)
  const errorOutput =
    error.stdout?.toString() ||
    error.stderr?.toString() ||
    error.message ||
    error.toString();
  if (
    errorOutput.includes("P1002") ||
    errorOutput.includes("timeout") ||
    errorOutput.includes("advisory lock") ||
    errorOutput.includes("Timed out")
  ) {
    console.warn(
      "⚠️  Migration deploy timed out (this is common with Neon databases on Vercel)"
    );
    console.warn("   Error: P1002 - Database connection timeout");
    console.warn(
      "   This is safe to ignore if migrations are already applied."
    );
    console.warn("   Continuing with build...");
  } else {
    console.warn("⚠️  Migration deploy failed:", errorOutput.substring(0, 200));
    console.warn("   Continuing with build...");
  }
}

console.log("🏗️  Building Next.js application...");
try {
  execSync("npx next build", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Build failed");
  process.exit(1);
}

console.log("✅ Build completed successfully");
