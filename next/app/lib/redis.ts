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

  try {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  } catch (error) {
    console.error("Failed to initialize Redis client:", error);
    throw error;
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
