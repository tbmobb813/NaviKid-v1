import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file. Use .env.test when running tests
// so local test settings (docker-compose/test helpers) are applied.
const envFile = process.env.NODE_ENV === 'test' ? '../../.env.test' : '../../.env';
dotenv.config({ path: path.join(__dirname, envFile) });

// Environment variable validation schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432').transform(Number),
  DB_NAME: z.string().default('navikid_db'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_SSL: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  DB_POOL_MIN: z.string().default('2').transform(Number),
  DB_POOL_MAX: z.string().default('10').transform(Number),

  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0').transform(Number),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Security
  BCRYPT_SALT_ROUNDS: z.string().default('12').transform(Number),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_WINDOW: z.string().default('60000').transform(Number),

  // Sentry (optional)
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),
  SENTRY_TRACES_SAMPLE_RATE: z.string().default('0.1').transform(Number),

  // Data Retention
  LOCATION_RETENTION_DAYS: z.string().default('30').transform(Number),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:8081,exp://localhost:8081'),

  // Local CA path for DB TLS (optional) - do NOT commit cert files to repo
  DB_CA_PATH: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Build database URL if not provided
const getDatabaseUrl = (): string => {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = env;
  return `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
};

// Build Redis URL if not provided. Honor REDIS_ENABLED env var to disable Redis in dev/test.
const getRedisUrl = (): string | undefined => {
  if (process.env.REDIS_ENABLED === 'false') {
    return undefined;
  }

  if (env.REDIS_URL) {
    return env.REDIS_URL;
  }

  const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB } = env;
  const auth = REDIS_PASSWORD ? `:${REDIS_PASSWORD}@` : '';
  return `redis://${auth}${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`;
};

// Export typed configuration
export const config = {
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  server: {
    port: env.PORT,
    host: env.HOST,
    nodeEnv: env.NODE_ENV,
  },

  database: {
    url: getDatabaseUrl(),
    ssl: env.DB_SSL,
    poolMin: env.DB_POOL_MIN,
    poolMax: env.DB_POOL_MAX,
    caPath: env.DB_CA_PATH || undefined,
    // Backwards-compatible fields used across the codebase
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  },

  redis: {
    url: getRedisUrl(),
    // Backwards-compatible fields used across the codebase
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  },

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  security: {
    bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
    rateLimit: {
      max: env.RATE_LIMIT_MAX,
      window: env.RATE_LIMIT_WINDOW,
      // some parts of the app expect `timeWindow`
      timeWindow: env.RATE_LIMIT_WINDOW,
    },
  },

  sentry: {
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    enabled: !!env.SENTRY_DSN && env.NODE_ENV === 'production',
  },

  dataRetention: {
    locationDays: env.LOCATION_RETENTION_DAYS,
    // alias used in some scripts
    locationRetentionDays: env.LOCATION_RETENTION_DAYS,
  },

  cors: {
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  },

  logging: {
    level: env.LOG_LEVEL,
    pretty: env.LOG_PRETTY,
  },

  supabase: {
    url: env.DATABASE_URL || process.env.SUPABASE_URL || undefined,
    anonKey: process.env.SUPABASE_ANON_KEY || undefined,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  },
} as const;

// Type export for use throughout the application
export type Config = typeof config;

// Provide a default export for modules that import the config as default
export default config;
