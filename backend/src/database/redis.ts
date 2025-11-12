import Redis from 'ioredis';
import config from '../config';
import logger from '../utils/logger';

class RedisClient {
  private client: Redis;
  private static instance: RedisClient;

  private constructor() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('error', (err) => {
      logger.error({ error: err  }, 'Redis client error');
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

  public getClient(): Redis {
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

  public async set(
    key: string,
    value: any,
    expiresIn?: number
  ): Promise<void> {
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
    } catch (error) {
      logger.error({ error  }, 'Redis health check failed');
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.client.quit();
    logger.info('Redis client closed');
  }
}

export default RedisClient.getInstance();
