import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Connection pool optimization for Cloud Run
// Cloud Run instances are ephemeral, so we use a conservative connection limit
let optimizedDatabaseUrl = process.env.DATABASE_URL;

// Validate DATABASE_URL is present
if (!optimizedDatabaseUrl) {
  console.error("❌ DATABASE_URL environment variable is not set!");
  throw new Error("DATABASE_URL is required but was not provided");
}

// Check if using Supabase pooler (port 6543) - PgBouncer doesn't support prepared statements
const isUsingPooler =
  optimizedDatabaseUrl.includes(":6543") ||
  optimizedDatabaseUrl.includes("pooler.supabase.com");

if (typeof optimizedDatabaseUrl === "string") {
  try {
    const url = new URL(optimizedDatabaseUrl);

    // CRITICAL: If using pooler, add pgbouncer=true to disable prepared statements
    // This is required for PgBouncer transaction pooling mode
    if (isUsingPooler && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
      console.log(
        "[prisma] ✅ Added pgbouncer=true for Supabase pooler (disables prepared statements)"
      );
    }

    // Add connection pool settings if not present
    if (!url.searchParams.has("connection_limit")) {
      // Conservative limit: 10 connections per instance
      // With Cloud Run auto-scaling, this prevents connection exhaustion
      url.searchParams.set("connection_limit", "10");
      url.searchParams.set("pool_timeout", "10");
    }

    optimizedDatabaseUrl = url.toString();
    // Update the environment variable so Prisma can read it
    process.env.DATABASE_URL = optimizedDatabaseUrl;

    if (isUsingPooler) {
      console.log(
        "[prisma] ✅ Using Supabase pooler with pgbouncer=true (prepared statements disabled)"
      );
      console.log(
        "[prisma] Connection URL (first 80 chars):",
        optimizedDatabaseUrl.substring(0, 80) + "..."
      );
      // Verify pgbouncer=true is in the URL
      if (optimizedDatabaseUrl.includes("pgbouncer=true")) {
        console.log(
          "[prisma] ✅ Verified: pgbouncer=true is in connection URL"
        );
      } else {
        console.error(
          "[prisma] ❌ ERROR: pgbouncer=true is NOT in connection URL!"
        );
      }
    }
  } catch (e) {
    // URL parsing failed, use original
    console.warn(
      "Could not parse DATABASE_URL for connection optimization:",
      e
    );
  }
}

// Prisma Client configuration (Prisma v6 - stable, no adapter needed)
// CRITICAL: Pass the optimized URL explicitly to ensure pgbouncer=true is used
// Prisma automatically detects pgbouncer=true in the URL and disables prepared statements
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    // Explicitly pass the optimized URL to ensure pgbouncer=true is used
    datasources: {
      db: {
        url: optimizedDatabaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Ensures a single instance per Node.js process
// Forces the client to use the current environment variables
// Adds logging to help debug connection issues
// Properly handles development vs production environments
