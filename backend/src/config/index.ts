import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Environment variable validation schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_NAME: z.string().default('navikid_db'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_SSL: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  DB_POOL_MIN: z.string().transform(Number).default('2'),
  DB_POOL_MAX: z.string().transform(Number).default('10'),

  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Security
  BCRYPT_SALT_ROUNDS: z.string().transform(Number).default('12'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('60000'),

  // Sentry (optional)
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),
  SENTRY_TRACES_SAMPLE_RATE: z.string().transform(Number).default('0.1'),

  // Data Retention
  LOCATION_RETENTION_DAYS: z.string().transform(Number).default('30'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:8081,exp://localhost:8081'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
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

// Build Redis URL if not provided
const getRedisUrl = (): string => {
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
  },

  database: {
    url: getDatabaseUrl(),
    ssl: env.DB_SSL,
    poolMin: env.DB_POOL_MIN,
    poolMax: env.DB_POOL_MAX,
  },

  redis: {
    url: getRedisUrl(),
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
