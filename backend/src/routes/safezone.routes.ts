import { FastifyInstance } from 'fastify';
import safeZoneService from '../services/safezone.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createSafeZoneSchema,
  updateSafeZoneSchema,
  checkLocationInSafeZoneSchema,
  validate,
} from '../utils/validation';
import { ApiResponse, SafeZoneType } from '../types';
import logger from '../utils/logger';
import { formatError } from '../utils/formatError';
import { getAuthUser } from '../utils/auth';

export async function safeZoneRoutes(fastify: FastifyInstance) {
  /**
   * Get all safe zones
   * GET /safe-zones
   */
  fastify.get(
    '/safe-zones',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
  const { userId } = getAuthUser(request);

        const safeZones = await safeZoneService.getSafeZones(userId);

        const response: ApiResponse = {
          success: true,
          data: { safeZones },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Get safe zones error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to get safe zones',
            code: 'SAFE_ZONE_GET_ERROR',
          },
        });
      }
    }
  );

  /**
   * Get safe zone by ID
   * GET /safe-zones/:id
   */
  // NOTE: route for checking locations must be registered before dynamic
  // `/safe-zones/:id` routes so that the literal path `/safe-zones/check`
  // does not get interpreted as an `:id` parameter.

  /**
   * Check if location is in safe zones
   * POST /safe-zones/check
   */
  fastify.post(
    '/safe-zones/check',
    {
      preHandler: [authMiddleware, validate(checkLocationInSafeZoneSchema)],
    },
    async (request, reply) => {
      try {
  const { userId } = getAuthUser(request);
        const { latitude, longitude } = request.body as { latitude: number; longitude: number };

        const result = await safeZoneService.checkLocationInSafeZones(
          userId,
          latitude,
          longitude
        );

        const response: ApiResponse = {
          success: true,
          data: result,
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Check safe zone error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to check safe zones',
            code: 'SAFE_ZONE_CHECK_ERROR',
          },
        });
      }
    }
  );

  /**
   * Get safe zone by ID
   * GET /safe-zones/:id
   */
  fastify.get(
    '/safe-zones/:id',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
  const { userId } = getAuthUser(request);
        const { id } = request.params as { id: string };

  const safeZone = await safeZoneService.getSafeZoneById(userId, id);

        if (!safeZone) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'Safe zone not found',
              code: 'SAFE_ZONE_NOT_FOUND',
            },
          });
        }

        const response: ApiResponse = {
          success: true,
          data: { safeZone },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Get safe zone error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to get safe zone',
            code: 'SAFE_ZONE_GET_ERROR',
          },
        });
      }
    }
  );

  /**
   * Create safe zone
   * POST /safe-zones
   */
  fastify.post(
    '/safe-zones',
    {
      preHandler: [authMiddleware, validate(createSafeZoneSchema)],
    },
    async (request, reply) => {
      try {
        const { name, centerLatitude, centerLongitude, radius, type } =
          request.body as {
            name: string;
            centerLatitude: number;
            centerLongitude: number;
            radius: number;
            type: SafeZoneType;
          };

        const safeZone = await safeZoneService.createSafeZone(
          getAuthUser(request).userId,
          name,
          centerLatitude,
          centerLongitude,
          radius,
          type as SafeZoneType
        );

        const response: ApiResponse = {
          success: true,
          data: { safeZone },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(201).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Create safe zone error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to create safe zone',
            code: 'SAFE_ZONE_CREATE_ERROR',
          },
        });
      }
    }
  );

  /**
   * Update safe zone
   * PUT /safe-zones/:id
   */
  fastify.put(
    '/safe-zones/:id',
    {
      preHandler: [authMiddleware, validate(updateSafeZoneSchema)],
    },
    async (request, reply) => {
      try {
  const { userId } = getAuthUser(request);
        const { id } = request.params as { id: string };
        const updates = request.body as Partial<{
          name: string;
          centerLatitude: number;
          centerLongitude: number;
          radius: number;
          type: SafeZoneType;
        }>;

        const safeZone = await safeZoneService.updateSafeZone(userId, id, updates);

        if (!safeZone) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'Safe zone not found',
              code: 'SAFE_ZONE_NOT_FOUND',
            },
          });
        }

        const response: ApiResponse = {
          success: true,
          data: { safeZone },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Update safe zone error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to update safe zone',
            code: 'SAFE_ZONE_UPDATE_ERROR',
          },
        });
      }
    }
  );

  /**
   * Delete safe zone
   * DELETE /safe-zones/:id
   */
  fastify.delete(
    '/safe-zones/:id',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
  const { userId } = getAuthUser(request);
        const { id } = request.params as { id: string };

        const deleted = await safeZoneService.deleteSafeZone(userId, id);

        if (!deleted) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'Safe zone not found',
              code: 'SAFE_ZONE_NOT_FOUND',
            },
          });
        }

        const response: ApiResponse = {
          success: true,
          data: { message: 'Safe zone deleted successfully' },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Delete safe zone error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to delete safe zone',
            code: 'SAFE_ZONE_DELETE_ERROR',
          },
        });
      }
    }
  );
 
}
