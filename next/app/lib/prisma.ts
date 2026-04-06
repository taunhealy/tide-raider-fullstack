// Lazy import PrismaClient to avoid build-time errors when Prisma client isn't generated
let PrismaClient: any;
let prismaInstance: any = null;

const globalForPrisma = global as unknown as { prisma: any };

// Optimize connection pool for Next.js Server Components
// Use smaller pool since Next.js creates many instances
function getPrisma() {
  const currentDatabaseUrl = process.env.DATABASE_URL;
  let optimizedDatabaseUrl = currentDatabaseUrl;

  if (optimizedDatabaseUrl) {
    try {
      const url = new URL(optimizedDatabaseUrl);
      const isUsingPooler =
        optimizedDatabaseUrl.includes(":6543") ||
        optimizedDatabaseUrl.includes("pooler.supabase.com");

      if (isUsingPooler && !url.searchParams.has("pgbouncer")) {
        url.searchParams.set("pgbouncer", "true");
        console.log("[prisma] ✅ Added pgbouncer=true for Supabase pooler in Next.js");
      }

      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "5");
        url.searchParams.set("pool_timeout", "10");
      }
      optimizedDatabaseUrl = url.toString();
    } catch (e) {
      // URL parsing failed
    }
  }

  // Force re-initialization if the database URL changed (e.g. env.local reload)
  if (globalForPrisma.prisma && globalForPrisma.prisma._lastUsedUrl !== optimizedDatabaseUrl) {
    console.log("[prisma] ⚠️ DATABASE_URL changed, re-initializing client...");
    prismaInstance = null;
    delete globalForPrisma.prisma;
  }

  if (prismaInstance) {
    return prismaInstance;
  }

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return createStubPrisma();
  }

  try {
    if (!PrismaClient) {
      const prismaModule = require("@prisma/client") as any;
      if (!prismaModule || !prismaModule.PrismaClient) {
        throw new Error("Prisma client not generated.");
      }
      PrismaClient = prismaModule.PrismaClient;
    }

    const newInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      datasources: {
        db: {
          url: optimizedDatabaseUrl,
        },
      },
    });

    // Store the URL used so we can detect changes
    (newInstance as any)._lastUsedUrl = optimizedDatabaseUrl;
    prismaInstance = newInstance;

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaInstance;
    }

    return prismaInstance;
  } catch (error: any) {
    const sanitizeMessage = (msg: string | undefined) => {
      if (!msg) return msg;
      return msg.replace(/postgresql:\/\/[^\s]+/gi, "postgresql://[REDACTED]");
    };
    const sanitizedMessage = sanitizeMessage(error?.message);
    console.error("[prisma] Failed to initialize Prisma client:", sanitizedMessage);
    throw new Error(`Prisma client initialization failed: ${sanitizedMessage || "Unknown error"}`);
  }
}

function createStubPrisma() {
  // Return a stub object that throws helpful errors if used
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          "Prisma client is not available during build. This should only happen during Next.js build phase."
        );
      },
    }
  );
}

// Use a getter to make it truly lazy - only evaluated when accessed
export const prisma = new Proxy({} as any, {
  get(_target, prop) {
    const instance = getPrisma();
    return instance[prop];
  },
});

// Ensures a single instance per Node.js process
// Forces the client to use the current environment variables
// Adds logging to help debug connection issues
// Properly handles development vs production environments
