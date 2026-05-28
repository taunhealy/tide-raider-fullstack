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
        // Cloud Run can run multiple instances — keep per-instance limit low
        // to avoid exhausting Supabase free tier (max 60 connections)
        // 3 connections × up to 10 instances = 30 max, leaving headroom
        url.searchParams.set("connection_limit", "3");
        url.searchParams.set("pool_timeout", "30");
        url.searchParams.set("connect_timeout", "30");
      }

      optimizedDatabaseUrl = url.toString();
      process.env.DATABASE_URL = optimizedDatabaseUrl;
    } catch (e) {
      console.warn("Could not parse DATABASE_URL for connection optimization:", e);
    }
  }

  // Force re-initialization if the database URL changed
  if (prismaInstance && (prismaInstance as any)._lastUsedUrl !== optimizedDatabaseUrl) {
    console.log("[prisma] ⚠️ DATABASE_URL changed, re-initializing backend client...");
    prismaInstance = null;
    if (globalForPrisma.prisma === prismaInstance) {
      delete (globalForPrisma as any).prisma;
    }
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

  // Global backup client extension to safeguard users and logs outside database
  const extendedInstance = newInstance.$extends({
    query: {
      user: {
        async create({ args, query }) {
          const result = await query(args);
          try {
            const userId = result?.id;
            if (userId) {
              // Dynamic import to avoid circular dependency
              import("../services/backupService").then(({ BackupService }) => {
                BackupService.backupUser(userId, newInstance).catch(err => {
                  console.error("[Prisma Backup Extension] Failed to backup user:", err);
                });
              }).catch(err => {
                console.error("[Prisma Backup Extension] Failed to import BackupService:", err);
              });
            }
          } catch (e) {
            console.error("[Prisma Backup Extension] Error in create user hook:", e);
          }
          return result;
        },
        async update({ args, query }) {
          const result = await query(args);
          try {
            const userId = result?.id;
            if (userId) {
              import("../services/backupService").then(({ BackupService }) => {
                BackupService.backupUser(userId, newInstance).catch(err => {
                  console.error("[Prisma Backup Extension] Failed to backup user:", err);
                });
              }).catch(err => {
                console.error("[Prisma Backup Extension] Failed to import BackupService:", err);
              });
            }
          } catch (e) {
            console.error("[Prisma Backup Extension] Error in update user hook:", e);
          }
          return result;
        },
        async upsert({ args, query }) {
          const result = await query(args);
          try {
            const userId = result?.id;
            if (userId) {
              import("../services/backupService").then(({ BackupService }) => {
                BackupService.backupUser(userId, newInstance).catch(err => {
                  console.error("[Prisma Backup Extension] Failed to backup user:", err);
                });
              }).catch(err => {
                console.error("[Prisma Backup Extension] Failed to import BackupService:", err);
              });
            }
          } catch (e) {
            console.error("[Prisma Backup Extension] Error in upsert user hook:", e);
          }
          return result;
        }
      },
      logEntry: {
        async create({ args, query }) {
          const result = await query(args);
          try {
            const logId = result?.id;
            if (logId) {
              import("../services/backupService").then(({ BackupService }) => {
                BackupService.backupLogEntry(logId, newInstance).catch(err => {
                  console.error("[Prisma Backup Extension] Failed to backup log:", err);
                });
              }).catch(err => {
                console.error("[Prisma Backup Extension] Failed to import BackupService:", err);
              });
            }
          } catch (e) {
            console.error("[Prisma Backup Extension] Error in create log hook:", e);
          }
          return result;
        },
        async update({ args, query }) {
          const result = await query(args);
          try {
            const logId = result?.id;
            if (logId) {
              import("../services/backupService").then(({ BackupService }) => {
                BackupService.backupLogEntry(logId, newInstance).catch(err => {
                  console.error("[Prisma Backup Extension] Failed to backup log:", err);
                });
              }).catch(err => {
                console.error("[Prisma Backup Extension] Failed to import BackupService:", err);
              });
            }
          } catch (e) {
            console.error("[Prisma Backup Extension] Error in update log hook:", e);
          }
          return result;
        },
        async upsert({ args, query }) {
          const result = await query(args);
          try {
            const logId = result?.id;
            if (logId) {
              import("../services/backupService").then(({ BackupService }) => {
                BackupService.backupLogEntry(logId, newInstance).catch(err => {
                  console.error("[Prisma Backup Extension] Failed to backup log:", err);
                });
              }).catch(err => {
                console.error("[Prisma Backup Extension] Failed to import BackupService:", err);
              });
            }
          } catch (e) {
            console.error("[Prisma Backup Extension] Error in upsert log hook:", e);
          }
          return result;
        },
        async delete({ args, query }) {
          const logId = args?.where?.id;
          const result = await query(args);
          try {
            if (logId) {
              import("../services/backupService").then(({ BackupService }) => {
                BackupService.deleteLogBackup(logId).catch(err => {
                  console.error("[Prisma Backup Extension] Failed to delete log backup:", err);
                });
              }).catch(err => {
                console.error("[Prisma Backup Extension] Failed to import BackupService:", err);
              });
            }
          } catch (e) {
            console.error("[Prisma Backup Extension] Error in delete log hook:", e);
          }
          return result;
        }
      }
    }
  });

  (extendedInstance as any)._lastUsedUrl = optimizedDatabaseUrl;
  prismaInstance = extendedInstance as any;

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
