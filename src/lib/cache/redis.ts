import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = Redis.fromEnv();
  }
  return redis;
}

const memoryCache = new Map<string, { expiresAt: number; value: unknown }>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redisClient = getRedis();
  if (redisClient) {
    const value = await redisClient.get<T>(key);
    return value ?? null;
  }

  const cached = memoryCache.get(key);
  if (!cached || cached.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return cached.value as T;
}

export async function cacheSet<T>(key: string, value: T, seconds: number) {
  const redisClient = getRedis();
  if (redisClient) {
    await redisClient.set(key, value, { ex: seconds });
    return;
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + seconds * 1000
  });
}
