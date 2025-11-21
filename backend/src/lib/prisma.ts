import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Connection pool optimization for Fly.io Postgres
// Fly.io Postgres typically has ~100 connection limit
// Prisma default: connection_limit = num_physical_cpus * 2 + 1
// For serverless/edge: use smaller pool
let optimizedDatabaseUrl = process.env.DATABASE_URL;
if (
  optimizedDatabaseUrl &&
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
    }
  } catch (e) {
    // URL parsing failed, use original
    console.warn("Could not parse DATABASE_URL for connection optimization");
  }
}

// Prisma Client configuration
const prismaConfig: {
  log: ("query" | "error" | "warn")[];
  datasources?: {
    db: {
      url: string;
    };
  };
} = {
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
};

// Only set datasources if we have a URL (for build-time compatibility)
if (optimizedDatabaseUrl) {
  prismaConfig.datasources = {
    db: {
      url: optimizedDatabaseUrl,
    },
  };
}

export const prisma = globalForPrisma.prisma || new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Ensures a single instance per Node.js process
// Forces the client to use the current environment variables
// Adds logging to help debug connection issues
// Properly handles development vs production environments
