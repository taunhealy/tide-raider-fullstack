#!/usr/bin/env node

const { execSync } = require("child_process");

console.log("🔧 Generating Prisma Client...");
execSync("npx prisma generate", { stdio: "inherit" });

console.log("🏗️  Building Next.js application...");
// Note: Vercel doesn't support --turbo flag yet, using standard webpack build
execSync("npx next build", { stdio: "inherit" });

console.log("✅ Build completed successfully");
