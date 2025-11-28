import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import jwt from '@fastify/jwt';
import * as Sentry from '@sentry/node';
import { config } from './config';
import { logger } from './utils/logger';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { checkConnection, closePool } from './db/connection';
import { checkRedisConnection, closeRedis, getRedis } from './db/redis';

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
      integrations: [new Sentry.Integrations.Http({ tracing: true })],
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
    // Use the shared Redis client (getRedis) when Redis is configured so it
    // can be closed centrally during shutdown. Avoid creating an untracked
    // redis client here which would otherwise keep the process alive.
    redis: config.redis.url ? getRedis() : undefined,
  });

  // JWT authentication
  await server.register(jwt, {
    secret: config.jwt.accessSecret,
    sign: {
      expiresIn: config.jwt.accessExpiresIn,
    },
  });

  // Add JWT verification decorator
  server.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (err: unknown) {
        reply
          .code(401)
          .send({ error: 'Unauthorized', message: 'Invalid or expired token' });
      }
    }
  );

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
  // Register rate limiting middleware BEFORE routes
  await server.register(rateLimit, {
    max: 100, // maximum number of requests per windowMs
    timeWindow: 15 * 60 * 1000, // 15 minutes
    // keyGenerator, allowList, ban, etc. can be customized as needed
  });

  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(userRoutes, { prefix: '/api/users' });
  await server.register(locationRoutes, { prefix: '/api/locations' });
  await server.register(geofenceRoutes, { prefix: '/api/safe-zones' });

  // During tests we allow routing without the /api prefix to support older
  // integration tests that call endpoints directly (e.g. /auth/register).
  // Register the same route handlers at the non-prefixed paths only in test
  // mode so production behavior is unchanged. Some test runners set
  // `NODE_ENV=test` but the config loader may not reflect that yet, so
  // check the environment variable as a fallback to be resilient.
  if (process.env.NODE_ENV === 'test' || config.isTest) {
    await server.register(authRoutes, { prefix: '/auth' });
    await server.register(userRoutes, { prefix: '/users' });
    await server.register(locationRoutes, { prefix: '/locations' });
    await server.register(geofenceRoutes, { prefix: '/safe-zones' });
  }

  // Log route registration info in test mode to aid debugging of integration
  // test failures where tests hit non-prefixed endpoints.
  if (process.env.NODE_ENV === 'test' || config.isTest) {
    try {
      logger.info({ testMode: true }, 'Registered non-prefixed test routes');
      // Print the route table for easier debugging when running integration tests
      // (Fastify exposes a `printRoutes` helper which returns a string).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const routesTable = (server as any).printRoutes ? (server as any).printRoutes() : 'printRoutes unavailable';
      logger.debug({ routes: routesTable }, 'Fastify route table');
    } catch (e) {
      logger.warn({ e }, 'Failed to print routes for debugging');
    }
  }

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

  // Ensure that when the server is closed (e.g., in tests) we also close
  // global resources like the DB pool and Redis client to avoid open handles
  // that keep the Node process alive.
  server.addHook('onClose', async () => {
    try {
      await closePool();
    } catch (e) {
      logger.warn({ e }, 'Error closing DB pool during server shutdown');
    }

    try {
      await closeRedis();
    } catch (e) {
      logger.warn({ e }, 'Error closing Redis during server shutdown');
    }

    if (config.sentry.enabled) {
      try {
        await Sentry.close(2000);
      } catch (e) {
        logger.warn({ e }, 'Error closing Sentry during server shutdown');
      }
    }
  });

  // Apply stricter, scoped rate limits to endpoints that perform DB access.
  // These registrations are scoped by prefix so they only affect the matching routes.
  await server.register(rateLimit, {
    max: 10, // e.g. protect auth endpoints more aggressively
    timeWindow: 60 * 1000, // 1 minute
    redis: config.redis.url ? getRedis() : undefined,
    prefix: '/api/auth',
  });

  await server.register(rateLimit, {
    max: 30, // users endpoints
    timeWindow: 60 * 1000, // 1 minute
    redis: config.redis.url ? getRedis() : undefined,
    prefix: '/api/users',
  });

  // Optionally protect other DB-heavy endpoints (adjust limits as needed)
  await server.register(rateLimit, {
    max: 60,
    timeWindow: 60 * 1000,
    redis: config.redis.url ? getRedis() : undefined,
    prefix: '/api/locations',
  });

  // Protect geofence/safe-zones endpoints with scoped rate limiting
  await server.register(rateLimit, {
    max: 50, // Moderate limit for geofence operations
    timeWindow: 60 * 1000, // 1 minute
    redis: config.redis.url ? getRedis() : undefined,
    prefix: '/api/safe-zones',
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
