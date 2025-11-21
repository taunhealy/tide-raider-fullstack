import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Connection pool optimization for Fly.io Postgres
// Fly.io Postgres typically has ~100 connection limit
// Prisma default: connection_limit = num_physical_cpus * 2 + 1
// For serverless/edge: use smaller pool
let optimizedDatabaseUrl = process.env.DATABASE_URL;

// Validate DATABASE_URL is present
if (!optimizedDatabaseUrl) {
  console.error("❌ DATABASE_URL environment variable is not set!");
  throw new Error("DATABASE_URL is required but was not provided");
}

if (
  typeof optimizedDatabaseUrl === "string" &&
  !optimizedDatabaseUrl.includes("?connection_limit")
) {
  try {
    const url = new URL(optimizedDatabaseUrl);
    if (!url.searchParams.has("connection_limit")) {
      // Conservative limit: 10 connections per instance
      // With 2-3 Fly.io instances = 20-30 connections total
      // Leaves 70+ connections for Next.js
      url.searchParams.set("connection_limit", "10");
      url.searchParams.set("pool_timeout", "10");
      optimizedDatabaseUrl = url.toString();
      // Update the environment variable so Prisma can read it
      process.env.DATABASE_URL = optimizedDatabaseUrl;
    }
  } catch (e) {
    // URL parsing failed, use original
    console.warn(
      "Could not parse DATABASE_URL for connection optimization:",
      e
    );
  }
}

// Prisma Client configuration
// Initialize with minimal config to avoid path resolution issues
// Prisma will read DATABASE_URL from environment automatically
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Ensures a single instance per Node.js process
// Forces the client to use the current environment variables
// Adds logging to help debug connection issues
// Properly handles development vs production environments
