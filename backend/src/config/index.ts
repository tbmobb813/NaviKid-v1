import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  server: {
    nodeEnv: string;
    port: number;
    host: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
  };
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  security: {
    bcryptSaltRounds: number;
    rateLimit: {
      max: number;
      timeWindow: number;
    };
  };
  sentry: {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
  };
  dataRetention: {
    locationRetentionDays: number;
  };
  cors: {
    origin: string[];
  };
  logging: {
    level: string;
    pretty: boolean;
  };
}

const config: Config = {
  server: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'navikid_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'change-me-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-in-production',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    },
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  },
  dataRetention: {
    locationRetentionDays: parseInt(process.env.LOCATION_RETENTION_DAYS || '30', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8081'],
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.LOG_PRETTY === 'true',
  },
};

export default config;
