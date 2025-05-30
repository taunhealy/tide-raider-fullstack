import { redis } from "./redis";

const AUTH_PREFIX = "auth:session:";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

export async function cacheUserSession(userId: string, sessionData: any) {
  const key = `${AUTH_PREFIX}${userId}`;
  // Ensure we're storing a string
  const serializedData = JSON.stringify(sessionData);
  await redis.set(key, serializedData, {
    ex: SESSION_TTL,
  });
}

export async function getCachedSession(userId: string) {
  const key = `${AUTH_PREFIX}${userId}`;
  const cached = await redis.get(key);
  if (!cached) return null;

  try {
    return JSON.parse(cached as string);
  } catch (error) {
    console.error("Failed to parse cached session:", error);
    return null;
  }
}

export async function clearUserSession(userId: string) {
  const key = `${AUTH_PREFIX}${userId}`;
  await redis.del(key);
}
