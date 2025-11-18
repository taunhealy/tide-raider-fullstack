import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Optimize connection pool for Next.js Server Components
// Use smaller pool since Next.js creates many instances
let optimizedDatabaseUrl = process.env.DATABASE_URL;
if (
  optimizedDatabaseUrl &&
  !optimizedDatabaseUrl.includes("?connection_limit")
) {
  try {
    const url = new URL(optimizedDatabaseUrl);
    if (!url.searchParams.has("connection_limit")) {
      // Conservative limit: 5 connections per Next.js instance
      // Vercel typically runs 2-10 instances = 10-50 connections total
      url.searchParams.set("connection_limit", "5");
      url.searchParams.set("pool_timeout", "10");
      optimizedDatabaseUrl = url.toString();
    }
  } catch (e) {
    // URL parsing failed, use original
    console.warn("Could not parse DATABASE_URL for connection optimization");
  }
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
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
