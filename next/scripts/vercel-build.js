#!/usr/bin/env node

const { spawn } = require("child_process");

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    let errorOutput = "";

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const error = new Error(`Command failed with exit code ${code}`);
        error.code = code;
        error.output = errorOutput;
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  console.log("🔧 Generating Prisma Client...");
  try {
    await runCommand("npx", ["prisma", "generate"]);
  } catch (error) {
    console.error("❌ Failed to generate Prisma Client");
    process.exit(1);
  }

  console.log("📦 Running database migrations...");
  try {
    await runCommand("npx", ["prisma", "migrate", "deploy"]);
    console.log("✅ Migrations applied successfully");
  } catch (error) {
    // Migration failures are safe to ignore if migrations are already applied
    // This is common with Neon databases on Vercel due to connection timeouts
    console.warn("⚠️  Migration deploy failed or timed out");
    console.warn(
      "   This is safe to ignore if migrations are already applied."
    );
    console.warn(
      "   Common causes: P1002 timeout, advisory lock timeout, or connection issues"
    );
    console.warn("   Continuing with build...");
  }

  console.log("🏗️  Building Next.js application...");
  try {
    await runCommand("npx", ["next", "build"]);
  } catch (error) {
    console.error("❌ Build failed");
    process.exit(1);
  }

  console.log("✅ Build completed successfully");
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
