import { Redis } from "@upstash/redis";

const createRedisClient = () => {
  if (process.env.REDIS_ENABLED === "false") {
    console.warn("Redis explicitly disabled - using no-op client");
    return {
      get: async (key: string) => {
        console.log(`[Redis no-op] GET ${key}`);
        return null;
      },
      set: async (key: string, value: any, options?: any) => {
        console.log(`[Redis no-op] SET ${key}`);
        return null;
      },
      setex: async (key: string, seconds: number, value: string) => {
        console.log(`[Redis no-op] SETEX ${key} ${seconds}`);
        return null;
      },
      del: async (key: string) => {
        console.log(`[Redis no-op] DEL ${key}`);
        return null;
      },
    } as unknown as Redis;
  }

  if (process.env.NODE_ENV === "development") {
    // Check if Redis credentials are missing
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      console.warn(
        "⚠️ Redis credentials missing in development - using no-op client"
      );
      return {
        get: async (key: string) => {
          console.log(`[Redis no-op] GET ${key}`);
          return null;
        },
        set: async (key: string, value: any, options?: any) => {
          console.log(`[Redis no-op] SET ${key}`, { value, options });
          return null;
        },
        del: async (key: string) => {
          console.log(`[Redis no-op] DEL ${key}`);
          return null;
        },
      } as unknown as Redis;
    }
  }

  // Final check for production credentials
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error("❌ CRITICAL: Redis credentials missing. Falling back to no-op client.");
    return {
      get: async (key: string) => null,
      set: async (key: string, value: any, options?: any) => null,
      setex: async (key: string, seconds: number, value: string) => null,
      del: async (key: string) => null,
    } as unknown as Redis;
  }

  try {
    const rawRedis = new Redis({
      url: (process.env.UPSTASH_REDIS_REST_URL || "").trim(),
      token: (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim(),
    });

    const withTimeout = <T>(promise: Promise<T>, timeoutMs = 1500): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Redis timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ]);
    };

    return {
      get: async (key: string) => {
        try {
          return await withTimeout(rawRedis.get(key));
        } catch (err) {
          console.error(`[Redis Client] GET ${key} failed or timed out:`, err);
          return null;
        }
      },
      set: async (key: string, value: any, options?: any) => {
        try {
          return await withTimeout(rawRedis.set(key, value, options));
        } catch (err) {
          console.error(`[Redis Client] SET ${key} failed or timed out:`, err);
          return null;
        }
      },
      setex: async (key: string, seconds: number, value: string) => {
        try {
          return await withTimeout(rawRedis.setex(key, seconds, value));
        } catch (err) {
          console.error(`[Redis Client] SETEX ${key} failed or timed out:`, err);
          return null;
        }
      },
      del: async (key: string) => {
        try {
          return await withTimeout(rawRedis.del(key));
        } catch (err) {
          console.error(`[Redis Client] DEL ${key} failed or timed out:`, err);
          return null;
        }
      },
    } as unknown as Redis;
  } catch (error) {
    console.error("Failed to initialize Redis client:", error);
    return {
      get: async (key: string) => null,
      set: async (key: string, value: any, options?: any) => null,
      setex: async (key: string, seconds: number, value: string) => null,
      del: async (key: string) => null,
    } as unknown as Redis;
  }
};

export const redis = createRedisClient();

// Cache constants
const CACHE_TTL = () => {
  const now = new Date();
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59
  );
  return Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
};
const SURF_CONDITIONS_PREFIX = "surf:conditions:";
const USER_SESSION_PREFIX = "user:session:";
const BEACH_COUNTS_PREFIX = "beach:counts:";

// Helper functions with better error handling
export async function getCachedSurfConditions(date: string) {
  try {
    const key = `${SURF_CONDITIONS_PREFIX}${date}`;
    console.log(`Attempting to get cached surf conditions for date: ${date}`);
    const cached = await redis.get(key);

    if (cached) {
      console.log(`Cache hit for ${key}`);
      return JSON.parse(cached as string);
    }
    console.log(`Cache miss for ${key}`);
    return null;
  } catch (error) {
    console.error("Error getting cached surf conditions:", error);
    return null;
  }
}

export async function cacheSurfConditions(date: string, data: any) {
  try {
    const key = `${SURF_CONDITIONS_PREFIX}${date}`;
    console.log(`Caching surf conditions for date: ${date}`);
    await redis.set(key, JSON.stringify(data), {
      ex: CACHE_TTL(), // Now using dynamic TTL that lasts until end of day
    });
    console.log(`Successfully cached data for ${key}`);
  } catch (error) {
    console.error("Error caching surf conditions:", error);
    // Don't throw the error, just log it
  }
}

export async function getCachedBeachCounts() {
  try {
    const key = `${BEACH_COUNTS_PREFIX}all`;
    console.log("Attempting to get cached beach counts");
    const cached = await redis.get(key);

    if (cached) {
      console.log(`Cache hit for beach counts`);
      return JSON.parse(cached as string);
    }
    console.log(`Cache miss for beach counts`);
    return null;
  } catch (error) {
    console.error("Error getting cached beach counts:", error);
    return null;
  }
}

export async function cacheBeachCounts(counts: Record<string, number>) {
  try {
    const key = `${BEACH_COUNTS_PREFIX}all`;
    console.log("Caching beach counts");
    await redis.set(key, JSON.stringify(counts), {
      ex: CACHE_TTL(), // Using same end-of-day TTL
    });
    console.log(`Successfully cached beach counts`);
  } catch (error) {
    console.error("Error caching beach counts:", error);
  }
}
