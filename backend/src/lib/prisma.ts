import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Connection pool optimization for Cloud Run
// Cloud Run instances are ephemeral, so we use a conservative connection limit
// Check for DATABASE_URL first, then fall back to DATABASE_URL_SUPABASE (for Cloud Run)
let prismaInstance: PrismaClient | null = null;

function getPrisma() {
  let optimizedDatabaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_SUPABASE;

  if (!optimizedDatabaseUrl) {
    console.error("❌ DATABASE_URL or DATABASE_URL_SUPABASE environment variable is not set!");
    throw new Error("DATABASE_URL is required but was not provided");
  }

  if (typeof optimizedDatabaseUrl === "string") {
    try {
      const url = new URL(optimizedDatabaseUrl);
      const isUsingPooler =
        optimizedDatabaseUrl.includes(":6543") ||
        optimizedDatabaseUrl.includes("pooler.supabase.com");

      if (isUsingPooler && !url.searchParams.has("pgbouncer")) {
        url.searchParams.set("pgbouncer", "true");
        console.log("[prisma] ✅ Added pgbouncer=true for Supabase pooler (disables prepared statements)");
      }

      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "10");
        url.searchParams.set("pool_timeout", "10");
      }

      optimizedDatabaseUrl = url.toString();
      process.env.DATABASE_URL = optimizedDatabaseUrl;
    } catch (e) {
      console.warn("Could not parse DATABASE_URL for connection optimization:", e);
    }
  }

  // Force re-initialization if the database URL changed
  if (globalForPrisma.prisma && (globalForPrisma.prisma as any)._lastUsedUrl !== optimizedDatabaseUrl) {
    console.log("[prisma] ⚠️ DATABASE_URL changed, re-initializing backend client...");
    prismaInstance = null;
    delete globalForPrisma.prisma;
  }

  if (prismaInstance) {
    return prismaInstance;
  }

  const newInstance = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: optimizedDatabaseUrl,
      },
    },
  });

  (newInstance as any)._lastUsedUrl = optimizedDatabaseUrl;
  prismaInstance = newInstance;

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }

  return prismaInstance;
}

export const prisma = new Proxy({} as any, {
  get(_target, prop) {
    const instance = getPrisma();
    return (instance as any)[prop];
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Ensures a single instance per Node.js process
// Forces the client to use the current environment variables
// Adds logging to help debug connection issues
// Properly handles development vs production environments
