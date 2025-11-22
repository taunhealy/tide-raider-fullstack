// Lazy import PrismaClient to avoid build-time errors when Prisma client isn't generated
let PrismaClient: any;
let prismaInstance: any = null;

const globalForPrisma = global as unknown as { prisma: any };

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
    // Don't log the error or URL to prevent exposing credentials
    // Silently fall back to original URL
  }
}

function getPrisma() {
  if (prismaInstance) {
    return prismaInstance;
  }

  // Skip Prisma initialization during build
  // Vercel sets NEXT_PHASE during build, and we can also check for other build indicators
  if (process.env.NEXT_PHASE === "phase-production-build") {
    // During build, Prisma client might not be available
    // Return stub to allow build to complete
    return createStubPrisma();
  }

  // Check if DATABASE_URL is set (but don't fail if it's not - might be using backend)
  if (!process.env.DATABASE_URL) {
    console.warn(
      "[prisma] DATABASE_URL not set. Prisma operations will fail. Make sure DATABASE_URL is configured."
    );
    // Don't return stub here - let it try to initialize and fail with a better error
  }

  // Lazy import to avoid build-time errors
  try {
    if (!PrismaClient) {
      // Use dynamic require with type assertion to avoid build-time type checking
      const prismaModule = require("@prisma/client") as any;
      if (!prismaModule || !prismaModule.PrismaClient) {
        throw new Error(
          "Prisma client not generated. Run: npm run prisma:generate"
        );
      }
      PrismaClient = prismaModule.PrismaClient;
    }

    prismaInstance =
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
      globalForPrisma.prisma = prismaInstance;
    }

    return prismaInstance;
  } catch (error: any) {
    // Sanitize error message to prevent exposing DATABASE_URL
    const sanitizeMessage = (msg: string | undefined) => {
      if (!msg) return msg;
      // Remove any potential database URLs from error messages
      return msg.replace(/postgresql:\/\/[^\s]+/gi, "postgresql://[REDACTED]");
    };

    // Log the actual error for debugging (sanitized)
    const sanitizedMessage = sanitizeMessage(error?.message);
    console.error("[prisma] Failed to initialize Prisma client:", sanitizedMessage);
    console.error("[prisma] Error details:", {
      message: sanitizedMessage,
      code: error?.code,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    });
    // Prisma client not available (e.g., during build or not generated)
    throw new Error(
      `Prisma client initialization failed: ${sanitizedMessage || "Unknown error"}. Make sure DATABASE_URL is set and Prisma client is generated (npm run prisma:generate).`
    );
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
