import config from '../config';
import logger from '../utils/logger';

// Allow disabling Redis in development/tests. When disabled we provide a
// Postgres-backed session store fallback implemented in services/sessionStore.
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

// Lazy require to avoid circular deps during module loading
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sessionStore = require('../services/sessionStore');

class DummyRedisClient {
  public getClient() {
    return null;
  }

  public async setSession(userId: string, token: string, expiresIn: number, data?: any) {
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

  public async set(key: string, value: any, expiresIn?: number) {
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

class RedisClient {
  private client: any;
  private static instance: RedisClient;

  private constructor() {
    // Lazy-load ioredis only when Redis is enabled to prevent the module
    // from being evaluated in environments where Redis is disabled.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IORedis: any = require('ioredis');
    const RedisCtor = IORedis?.default ?? IORedis;

    this.client = new RedisCtor({
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

    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('error', (err: any) => {
      logger.error({ error: err }, 'Redis client error');
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

  public getClient(): any {
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

  public async getSession(userId: string, token: string): Promise<any | null> {
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
  public async get<T = any>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  public async set(key: string, value: any, expiresIn?: number): Promise<void> {
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
    } catch (error: any) {
      logger.error({ error }, 'Redis health check failed');
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.client.quit();
    logger.info('Redis client closed');
  }
}

const exportedInstance: any = REDIS_ENABLED
  ? RedisClient.getInstance()
  : new DummyRedisClient();

export default exportedInstance;
