#!/usr/bin/env node

const { spawn } = require("child_process");

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const error = new Error(`Command failed with exit code ${code}`);
        error.code = code;
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
  let migrationSucceeded = false;
  try {
    await runCommand("npx", ["prisma", "migrate", "deploy"]);
    console.log("✅ Migrations applied successfully");
    migrationSucceeded = true;
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
    migrationSucceeded = false;
  }

  // Always continue to build, regardless of migration status
  console.log("🏗️  Building Next.js application...");
  try {
    await runCommand("npx", ["next", "build"]);
  } catch (error) {
    console.error("❌ Build failed");
    process.exit(1);
  }

  console.log("✅ Build completed successfully");
  // Exit with success code (0) even if migrations failed
  process.exit(0);
}

// Wrap in try-catch to ensure we handle all errors
main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  // Only exit with error if it's not a migration error
  if (!error.message || !error.message.includes("migrate")) {
    process.exit(1);
  }
  // For migration errors, continue (though we should have caught them above)
  console.warn("⚠️  Continuing despite error...");
  process.exit(0);
});
