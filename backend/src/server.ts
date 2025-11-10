import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import jwt from '@fastify/jwt';
import * as Sentry from '@sentry/node';
import { config } from './config';
import { logger } from './utils/logger';
import { checkConnection, closePool } from './db/connection';
import { checkRedisConnection, closeRedis } from './db/redis';

// Import routes
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { locationRoutes } from './routes/locations';
import { geofenceRoutes } from './routes/geofences';
import { healthRoutes } from './routes/health';

/**
 * Build and configure Fastify application
 */
export async function buildServer() {
  // Initialize Sentry if enabled
  if (config.sentry.enabled && config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.sentry.environment,
      tracesSampleRate: config.sentry.tracesSampleRate,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
      ],
    });
    logger.info('Sentry initialized');
  }

  const server = Fastify({
    logger: logger,
    trustProxy: true,
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
  });

  // Register plugins
  await server.register(sensible);

  // CORS configuration
  await server.register(cors, {
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Security headers
  await server.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
    crossOriginEmbedderPolicy: false,
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: config.security.rateLimit.max,
    timeWindow: config.security.rateLimit.window,
    redis: config.redis.url ? require('ioredis').createClient(config.redis.url) : undefined,
  });

  // JWT authentication
  await server.register(jwt, {
    secret: config.jwt.accessSecret,
    sign: {
      expiresIn: config.jwt.accessExpiresIn,
    },
  });

  // Add JWT verification decorator
  server.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
  });

  // Global error handler
  server.setErrorHandler((error, request, reply) => {
    // Log error
    logger.error(
      {
        err: error,
        reqId: request.id,
        url: request.url,
        method: request.method,
      },
      'Request error'
    );

    // Report to Sentry
    if (config.sentry.enabled) {
      Sentry.captureException(error, {
        contexts: {
          request: {
            method: request.method,
            url: request.url,
            headers: request.headers,
          },
        },
      });
    }

    // Handle validation errors
    if (error.validation) {
      return reply.code(400).send({
        error: 'Validation Error',
        message: 'Request validation failed',
        details: error.validation,
      });
    }

    // Handle known errors
    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.name,
        message: error.message,
      });
    }

    // Handle database errors
    if (error.code?.startsWith('23')) {
      // PostgreSQL constraint violation
      return reply.code(409).send({
        error: 'Conflict',
        message: 'A database constraint was violated',
      });
    }

    // Default to 500 for unknown errors
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: config.isProduction ? 'An unexpected error occurred' : error.message,
    });
  });

  // Register routes
  await server.register(healthRoutes, { prefix: '/api/health' });
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(userRoutes, { prefix: '/api/users' });
  await server.register(locationRoutes, { prefix: '/api/locations' });
  await server.register(geofenceRoutes, { prefix: '/api/safe-zones' });

  // Root endpoint
  server.get('/', async () => {
    return {
      service: 'NaviKid Backend API',
      version: '1.0.0',
      status: 'running',
      environment: config.env,
    };
  });

  // 404 handler
  server.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  return server;
}

/**
 * Start the server
 */
export async function startServer() {
  try {
    // Check database connection
    logger.info('Checking database connection...');
    const dbConnected = await checkConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Check Redis connection
    logger.info('Checking Redis connection...');
    const redisConnected = await checkRedisConnection();
    if (!redisConnected) {
      logger.warn('Redis connection failed - some features may not work');
    }

    // Build server
    const server = await buildServer();

    // Start listening
    await server.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info(
      {
        port: config.server.port,
        host: config.server.host,
        env: config.env,
      },
      'Server started successfully'
    );

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal');

      try {
        await server.close();
        await closePool();
        await closeRedis();

        if (config.sentry.enabled) {
          await Sentry.close(2000);
        }

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error({ error }, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}
