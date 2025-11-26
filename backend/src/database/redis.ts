import config from '../config';
import logger from '../utils/logger';
import { formatError } from '../utils/formatError';
import { getCtorFromModule } from '../utils/interop';
import { RedisLike, InternalRedisClient } from '../types';

// Allow disabling Redis in development/tests. When disabled we provide a
// Postgres-backed session store fallback implemented in services/sessionStore.
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

// Lazy require to avoid circular deps during module loading
type SessionStoreLike = {
  setSession: (userId: string, token: string, expiresIn: number, data?: unknown) => Promise<void>;
  getSession: (userId: string, token: string) => Promise<unknown | null>;
  deleteSession: (userId: string, token: string) => Promise<void>;
  deleteAllUserSessions: (userId: string) => Promise<void>;
  get: (key: string) => Promise<unknown | null>;
  set: (key: string, value: unknown, expiresIn?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
  exists: (key: string) => Promise<boolean>;
  healthCheck: () => Promise<boolean>;
  close: () => Promise<void>;
};
const sessionStore = require('../services/sessionStore') as SessionStoreLike;

// We reuse the canonical RedisLike runtime adapter from `types` for the
// shape of the client we expose to the rest of the codebase.

class DummyRedisClient {
  public getClient() {
    return null;
  }

  public async setSession(userId: string, token: string, expiresIn: number, data?: unknown) {
    return sessionStore.setSession(userId, token, expiresIn, data);
  }

  public async getSession(userId: string, token: string) {
    return sessionStore.getSession(userId, token);
  }

  public async deleteSession(userId: string, token: string) {
    return sessionStore.deleteSession(userId, token);
  }

  public async deleteAllUserSessions(userId: string) {
    return sessionStore.deleteAllUserSessions(userId);
  }

  // cache-like fallbacks
  public async get(key: string) {
    return sessionStore.get(key);
  }

  public async set(key: string, value: unknown, expiresIn?: number) {
    return sessionStore.set(key, value, expiresIn);
  }

  public async delete(key: string) {
    return sessionStore.delete(key);
  }

  public async exists(key: string) {
    return sessionStore.exists(key);
  }

  public async healthCheck() {
    return sessionStore.healthCheck();
  }

  public async close() {
    return sessionStore.close();
  }
}

// InternalRedisClient type is imported from `types` (stronger, non-optional methods)

class RedisClient {
  private client: InternalRedisClient;
  private static instance: RedisClient;

  private constructor() {
  // Lazy-load ioredis only when Redis is enabled to prevent the module
  // from being evaluated in environments where Redis is disabled.
  const IORedis: unknown = require('ioredis');
    // Resolve constructor (CJS/ESM) using helper
    const RedisCtor = getCtorFromModule(IORedis);

    // Initialize client and keep a typed wrapper exposing only the methods
    // we actually use in the codebase.
    const raw = new RedisCtor({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });
    // Cast the raw constructed client to our conservative RedisLike shape.
    const rawClient = raw as unknown as RedisLike;
    this.client = {
      on: (event: string, cb: (...args: unknown[]) => void) => rawClient.on!(event, cb),
      get: (key: string) => rawClient.get!(key),
      setex: (key: string, expires: number, value: string) => rawClient.setex!(key, expires, value),
      set: (key: string, value: string) => rawClient.set!(key, value),
      del: (...keys: string[]) => rawClient.del!(...keys),
      keys: (pattern: string) => rawClient.keys!(pattern),
      exists: (key: string) => rawClient.exists!(key),
      ping: () => rawClient.ping!(),
      quit: () => rawClient.quit!(),
      incr: rawClient.incr ? (key: string) => rawClient.incr!(key) : undefined,
      expire: rawClient.expire ? (key: string, ttl: number) => rawClient.expire!(key, ttl) : undefined,
      pipeline: rawClient.pipeline ? () => rawClient.pipeline!() : undefined,
    };

    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('error', (err: unknown) => {
      const { errorObj } = formatError(err);
      logger.error({ error: errorObj }, 'Redis client error');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public getClient(): unknown {
    return this.client;
  }

  // Session management
  public async setSession(
    userId: string,
    token: string,
    expiresIn: number
  ): Promise<void> {
    const key = `session:${userId}:${token}`;
  await this.client.setex(key, expiresIn, JSON.stringify({ userId, token }));
  }

  public async getSession(userId: string, token: string): Promise<unknown | null> {
    const key = `session:${userId}:${token}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  public async deleteSession(userId: string, token: string): Promise<void> {
    const key = `session:${userId}:${token}`;
  await this.client.del(key);
  }

  public async deleteAllUserSessions(userId: string): Promise<void> {
    const pattern = `session:${userId}:*`;
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // Cache management
  public async get<T = unknown>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  public async set(key: string, value: unknown, expiresIn?: number): Promise<void> {
  const serialized = JSON.stringify(value);
    if (expiresIn) {
      await this.client.setex(key, expiresIn, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  public async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  public async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error: unknown) {
      const { errorObj } = formatError(error);
      logger.error({ error: errorObj }, 'Redis health check failed');
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.client.quit();
    logger.info('Redis client closed');
  }
}

const exportedInstance: RedisClient | DummyRedisClient = REDIS_ENABLED
  ? RedisClient.getInstance()
  : new DummyRedisClient();

export default exportedInstance;
