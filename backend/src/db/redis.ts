import { config } from '../config';
import { logger } from '../utils/logger';
import { getCtorFromModule } from '../utils/interop';
import { RedisLike } from '../types';

const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

// Lazy require of sessionStore to avoid circular deps
const sessionStore = require('../services/sessionStore');

let redis: RedisLike | null = null;

/**
 * Get or create Redis client (no-op when REDIS_ENABLED=false)
 */
export function getRedis(): RedisLike | null {
  if (!REDIS_ENABLED) {
    return null;
  }

  if (!redis) {
    // Lazy-load ioredis only when Redis is enabled to avoid loading the
    // module (and any native deps) in environments where Redis is disabled.
    const IORedis: unknown = require('ioredis');

    // Resolve constructor in a single helper to support CJS/ESM shapes.
    const RedisCtor = getCtorFromModule(IORedis);

    const constructed = new RedisCtor(config.redis.url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    redis = constructed as unknown as RedisLike;

    redis.on?.('connect', () => {
      logger.info('Redis connected');
    });

    redis.on?.('ready', () => {
      logger.info('Redis ready to accept commands');
    });

    redis.on?.('error', (err: unknown) => {
      const errMsg = String(err);
      logger.error({ err: errMsg }, 'Redis error');
    });

    redis.on?.('close', () => {
      logger.warn('Redis connection closed');
    });

    redis.on?.('reconnecting', () => {
      logger.info('Redis reconnecting');
    });
  }

  return redis;
}

/**
 * Close Redis connection (or sessionStore when Redis disabled)
 */
export async function closeRedis(): Promise<void> {
  if (!REDIS_ENABLED) {
    if (sessionStore && sessionStore.close) {
      await sessionStore.close();
      logger.info('Session store closed (Redis disabled)');
    }
    return;
  }

  if (redis) {
    await (redis as RedisLike).quit?.();
    redis = null;
    logger.info('Redis connection closed');
  }
}

/**
 * Check Redis connectivity (or sessionStore health when Redis disabled)
 */
export async function checkRedisConnection(): Promise<boolean> {
  if (!REDIS_ENABLED) {
    try {
      if (sessionStore && sessionStore.healthCheck) {
        return await sessionStore.healthCheck();
      }
      return true;
    } catch (error) {
      logger.error({ error }, 'Session store health check failed');
      return false;
    }
  }

  try {
    const r = getRedis() as RedisLike;
    const pong = await r.ping?.();
    logger.info({ pong }, 'Redis connection verified');
    return pong === 'PONG';
  } catch (error) {
    logger.error({ error: String(error) }, 'Redis connection check failed');
    return false;
  }
}

/**
 * Cache helpers (delegate to sessionStore when Redis disabled)
 */
export const cache = {
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    if (!REDIS_ENABLED) {
      return sessionStore.set(key, value, ttl);
    }
    const r = getRedis() as RedisLike;
    const serialized = JSON.stringify(value);
    if (ttl) {
      await r.setex?.(key, ttl, serialized);
    } else {
      await r.set?.(key, serialized);
    }
  },

  async get<T = any>(key: string): Promise<T | null> {
    if (!REDIS_ENABLED) {
      return sessionStore.get(key);
    }
    const r = getRedis() as RedisLike;
    const value = await r.get?.(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  async del(key: string): Promise<void> {
    if (!REDIS_ENABLED) {
      return sessionStore.delete(key);
    }
    const r = getRedis() as RedisLike;
    await r.del?.(key);
  },

  async exists(key: string): Promise<boolean> {
    if (!REDIS_ENABLED) {
      return sessionStore.exists(key);
    }
    const r = getRedis() as RedisLike;
    const result = await r.exists?.(key);
    return result === 1;
  },

  async expire(key: string, ttl: number): Promise<void> {
    if (!REDIS_ENABLED) {
      // sessionStore doesn't support expire - noop
      return;
    }
    const r = getRedis() as RedisLike;
    await r.expire?.(key, ttl as number);
  },

  async incr(key: string): Promise<number> {
    if (!REDIS_ENABLED) {
      // sessionStore can't atomic increment; fallback to 1
      return 1;
    }
    const r = getRedis() as RedisLike;
    return (await r.incr?.(key)) as number;
  },

  async incrWithTTL(key: string, ttl: number): Promise<number> {
    if (!REDIS_ENABLED) {
      return 1;
    }
    const r = getRedis() as RedisLike;
    const pipeline = r.pipeline?.();
    pipeline?.incr(key);
    pipeline?.expire(key, ttl);
    const results = await pipeline?.exec();
    return (results?.[0]?.[1] as number) ?? 1;
  },
};
