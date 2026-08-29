import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const rateLimit = {
  // Max 5 calls per hour per client
  checkAndIncrement: async (slug: string, limit = 5, windowSeconds = 3600) => {
    const key = `rate_limit:${slug}`;
    const current = await redis.get<number>(key) || 0;
    if (current >= limit) {
      return { allowed: false, remaining: 0 };
    }
    const newCount = await redis.incr(key);
    if (newCount === 1) {
      await redis.expire(key, windowSeconds);
    }
    return { allowed: true, remaining: limit - newCount };
  },
};
