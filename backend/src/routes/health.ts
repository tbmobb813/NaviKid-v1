import { FastifyInstance } from 'fastify';
import { checkConnection } from '../db/connection';
import { checkRedisConnection } from '../db/redis';
import { config } from '../config';

export async function healthRoutes(server: FastifyInstance) {
  /**
   * GET /api/health
   * Basic health check
   */
  server.get('/', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
    };
  });

  /**
   * GET /api/health/detailed
   * Detailed health check with dependencies
   */
  server.get(
    '/detailed',
    {
      // Protect the detailed health endpoint from abuse — it performs DB/Redis checks
      config: {
        rateLimit: {
          max: 30,
          timeWindow: 60 * 1000, // 1 minute
          errorResponseBuilder: function () {
            return { error: 'Too many requests for detailed health' };
          },
        },
      },
    },
    async (_request, reply) => {
      const startTime = Date.now();

      // Check database
      const dbHealth = await checkConnection().catch(() => false);

      // Check Redis
      const redisHealth = await checkRedisConnection().catch(() => false);

      const responseTime = Date.now() - startTime;

      const health = {
        status: dbHealth && redisHealth ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
        version: '1.0.0',
        checks: {
          database: {
            status: dbHealth ? 'up' : 'down',
            responseTime: dbHealth ? `${responseTime}ms` : 'N/A',
          },
          redis: {
            status: redisHealth ? 'up' : 'down',
          },
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
          external: Math.round(process.memoryUsage().external / 1024 / 1024) + 'MB',
        },
      };

      const statusCode = health.status === 'healthy' ? 200 : 503;
      reply.code(statusCode).send(health);
    }
  );

  /**
   * GET /api/health/ready
   * Kubernetes readiness probe
   */
  server.get(
    '/ready',
    {
      // Readiness can be hit frequently by orchestrators; add a gentle rate limit
      config: {
        rateLimit: {
          max: 60,
          timeWindow: 60 * 1000, // 1 minute
        },
      },
    },
    async (_request, reply) => {
      const dbReady = await checkConnection().catch(() => false);

      if (dbReady) {
        reply.code(200).send({ ready: true });
      } else {
        reply.code(503).send({ ready: false });
      }
    }
  );

  /**
   * GET /api/health/live
   * Kubernetes liveness probe
   */
  server.get('/live', async (_request, reply) => {
    reply.code(200).send({ alive: true });
  });
}
