import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import * as Sentry from '@sentry/node';
import { config } from './config';
import { logger } from './utils/logger';
import { SocketLike } from './types';
import db from './database';
import redis from './database/redis';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes
import { authRoutes } from './routes/auth.routes';
import { locationRoutes } from './routes/location.routes';
import { safeZoneRoutes } from './routes/safezone.routes';
import { emergencyRoutes } from './routes/emergency.routes';
import { offlineRoutes } from './routes/offline.routes';

async function buildServer() {
  // Initialize Sentry if DSN is provided
  if (config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.sentry.environment,
      tracesSampleRate: config.sentry.tracesSampleRate,
    });
  }

  // Create Fastify instance
  const fastify = Fastify({
    logger: false, // We use pino directly
    trustProxy: true,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
  });

  // Register CORS
  await fastify.register(cors, {
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Register rate limiting
  // Use the raw ioredis client for rate-limit storage when available so the
  // store implementation can call defineCommand and other native APIs.
  const rateLimitRedis =
    typeof (redis as any).getRawClient === 'function'
      ? (redis as any).getRawClient()
      : redis.getClient();

  await fastify.register(rateLimit, {
    max: config.security.rateLimit.max,
    timeWindow: config.security.rateLimit.timeWindow,
    cache: 10000,
    allowList: ['127.0.0.1'],
    redis: rateLimitRedis,
    nameSpace: 'rl:',
    continueExceeding: true,
    skipOnError: true,
  });

  // Register WebSocket support
  await fastify.register(websocket);

  // Request logging
  fastify.addHook('onRequest', async (request) => {
    logger.info(
      {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        requestId: request.id,
      },
      'Incoming request'
    );
  });

  // Response logging
  fastify.addHook('onResponse', async (request, reply) => {
    logger.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.getResponseTime(),
        requestId: request.id,
      },
      'Request completed'
    );
  });

  // Health check endpoint
  fastify.get('/health', async (_request, reply) => {
    const dbHealthy = await db.healthCheck();
    const redisHealthy = await redis.healthCheck();

    const health = {
      status: dbHealthy && redisHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'up' : 'down',
        redis: redisHealthy ? 'up' : 'down',
      },
    };

    // Return ApiResponse shape expected by the client tests
    const response = {
      success: dbHealthy && redisHealthy,
      data: health,
      meta: { timestamp: new Date() },
    } as const;

    reply.status(dbHealthy && redisHealthy ? 200 : 503).send(response);
  });

  // API info endpoint
  fastify.get('/', async (_request, reply) => {
    reply.send({
      name: 'NaviKid API',
      version: '1.0.0',
      description: 'Privacy-first family location tracking backend',
      endpoints: {
        health: '/health',
        auth: '/auth/*',
        locations: '/locations/*',
        safeZones: '/safe-zones/*',
        emergency: '/emergency-contacts/*, /emergency/alert',
        offline: '/offline-actions/*',
      },
    });
  });

  // Register API routes
  await fastify.register(authRoutes);
  await fastify.register(locationRoutes);
  await fastify.register(safeZoneRoutes);
  await fastify.register(emergencyRoutes);
  await fastify.register(offlineRoutes);

  // WebSocket route for real-time location updates
  fastify.get('/ws/locations', { websocket: true }, (connection, req) => {
    const sock = (connection as unknown as { socket: SocketLike }).socket;
    logger.info(
      {
        ip: sock?.remoteAddress,
        headers: req.headers,
      },
      'WebSocket connection established'
    );

    // Send an initial system_message so tests waiting for a system message receive it
    try {
      sock.send(
        JSON.stringify({
          type: 'system_message',
          data: { message: 'Welcome to NaviKid real-time service' },
          timestamp: new Date().toISOString(),
        })
      );
    } catch (err) {
      logger.error({ err }, 'Failed to send initial system_message');
    }

    sock.on('message', (message: unknown) => {
      try {
        const msgStr =
          typeof message === 'string' ? message : (message?.toString?.() ?? '');
        const data = JSON.parse(msgStr);
        logger.debug({ data }, 'WebSocket message received');

        // If client pings, reply with a system_message (tests expect this)
        if (data && data.type === 'ping') {
          try {
            sock.send(
              JSON.stringify({
                type: 'system_message',
                data: { message: 'pong' },
                timestamp: new Date().toISOString(),
              })
            );
          } catch (err) {
            logger.error({ err }, 'Failed to send system_message in response to ping');
          }
        }

        // Echo ack for compatibility
        try {
          sock.send(
            JSON.stringify({
              type: 'ack',
              data: { message: 'Location update received' },
              timestamp: new Date().toISOString(),
            })
          );
        } catch (err) {
          logger.error({ err }, 'Failed to send ack');
        }
      } catch (error: unknown) {
        logger.error({ error }, 'WebSocket message error');
      }
    });

    sock.on('close', () => {
      logger.info('WebSocket connection closed');
    });

    sock.on('error', (error: unknown) => {
      logger.error({ error }, 'WebSocket error');
    });
  });

  // Error handlers
  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  return fastify;
}

async function start() {
  try {
    // Build server
    const fastify = await buildServer();

    // Test database connection
    const dbHealthy = await db.healthCheck();
    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }
    logger.info('Database connection established');

    // Test Redis connection
    const redisHealthy = await redis.healthCheck();
    if (!redisHealthy) {
      throw new Error('Redis connection failed');
    }
    logger.info('Redis connection established');

    // Start server
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info(
      {
        host: config.server.host,
        port: config.server.port,
        env: config.server.nodeEnv,
        url: `http://${config.server.host}:${config.server.port}`,
      },
      'Server started successfully'
    );

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        // Avoid format-string logging with externally-controlled values;
        // include the signal in structured data instead.
        logger.info({ signal }, 'Signal received, shutting down gracefully');

        try {
          await fastify.close();
          await db.close();
          await redis.close();
          logger.info('Server shut down successfully');
          process.exit(0);
        } catch (error) {
          logger.error({ error }, 'Error during shutdown');
          process.exit(1);
        }
      });
    });
  } catch (error) {
    // Log start error. Keep structured logger but also include raw error fields for local debugging
    logger.error({ error }, 'Start error: Failed to start server');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});

// Start the server
start();
