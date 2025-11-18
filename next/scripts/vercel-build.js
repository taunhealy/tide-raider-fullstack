#!/usr/bin/env node

const { execSync } = require("child_process");

console.log("🏗️  Building Next.js application...");
execSync("npx next build", { stdio: "inherit" });

console.log("✅ Build completed successfully");
