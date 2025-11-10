import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

let redis: Redis | null = null;

/**
 * Get or create Redis client
 */
export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    redis.on('ready', () => {
      logger.info('Redis ready to accept commands');
    });

    redis.on('error', (err) => {
      logger.error({ err }, 'Redis error');
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redis.on('reconnecting', () => {
      logger.info('Redis reconnecting');
    });
  }

  return redis;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  }
}

/**
 * Check Redis connectivity
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const redis = getRedis();
    const pong = await redis.ping();
    logger.info({ pong }, 'Redis connection verified');
    return pong === 'PONG';
  } catch (error) {
    logger.error({ error }, 'Redis connection check failed');
    return false;
  }
}

/**
 * Cache helpers
 */
export const cache = {
  /**
   * Set a value in cache with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const redis = getRedis();
    const serialized = JSON.stringify(value);

    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const redis = getRedis();
    const value = await redis.get(key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    const redis = getRedis();
    await redis.del(key);
  },

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    const redis = getRedis();
    const result = await redis.exists(key);
    return result === 1;
  },

  /**
   * Set expiration on a key
   */
  async expire(key: string, ttl: number): Promise<void> {
    const redis = getRedis();
    await redis.expire(key, ttl);
  },

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    const redis = getRedis();
    return redis.incr(key);
  },

  /**
   * Increment a counter with TTL
   */
  async incrWithTTL(key: string, ttl: number): Promise<number> {
    const redis = getRedis();
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, ttl);
    const results = await pipeline.exec();
    return results?.[0]?.[1] as number;
  },
};
