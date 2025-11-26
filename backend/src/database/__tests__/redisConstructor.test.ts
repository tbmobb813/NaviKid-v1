import path from 'path';

describe('Redis ctor resolution (CJS/ESM shapes)', () => {
  const originalEnv = process.env.REDIS_ENABLED;

  afterEach(() => {
    // restore env and reset module registry
    process.env.REDIS_ENABLED = originalEnv;
    jest.resetModules();
    jest.unmock('ioredis');
  });

  test('constructs when module exports default (ESM transpiled)', async () => {
    process.env.REDIS_ENABLED = 'true';
    // Provide minimal required env for config parsing
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'A'.repeat(32);
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'B'.repeat(32);

    // Mock ioredis to export a default class
    const FakeRedis = class {
      public opts: any;
      constructor(opts?: any) {
        this.opts = opts;
      }
      on() {}
      get() {
        return Promise.resolve(null);
      }
      setex() {}
      set() {}
      del() {}
      keys() {
        return Promise.resolve([]);
      }
      exists() {
        return Promise.resolve(1);
      }
      ping() {
        return Promise.resolve('PONG');
      }
      quit() {}
    };

    jest.doMock('ioredis', () => ({ default: FakeRedis }), { virtual: true });

    // Import the module after mocking
    const exported = require('../redis').default;

    // exported should be an instance (RedisClient or DummyRedisClient)
    expect(exported).toBeDefined();

    const client = exported.getClient();
    expect(client).toBeDefined();

    // client should have ping method (wrapper exposes ping)
    // call ping to ensure our wrapper delegates without throwing
    await expect((client as any).ping()).resolves.toBe('PONG');
  });

  test('constructs when module exports constructor directly (CJS)', async () => {
    process.env.REDIS_ENABLED = 'true';
    // Provide minimal required env for config parsing
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'A'.repeat(32);
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'B'.repeat(32);

    const FakeRedis = class {
      public opts: any;
      constructor(opts?: any) {
        this.opts = opts;
      }
      on() {}
      get() {
        return Promise.resolve(null);
      }
      setex() {}
      set() {}
      del() {}
      keys() {
        return Promise.resolve([]);
      }
      exists() {
        return Promise.resolve(1);
      }
      ping() {
        return Promise.resolve('PONG');
      }
      quit() {}
    };

    // Mock module directly as constructor
    jest.doMock('ioredis', () => FakeRedis, { virtual: true });

    const exported = require('../redis').default;
    expect(exported).toBeDefined();

    const client = exported.getClient();
    expect(client).toBeDefined();
    await expect((client as any).ping()).resolves.toBe('PONG');
  });
});
