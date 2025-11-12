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
        const userId = request.user!.userId;

        const safeZones = await safeZoneService.getSafeZones(userId);

        const response: ApiResponse = {
          success: true,
          data: { safeZones },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: any) {
        logger.error({ error  }, 'Get safe zones error');
        reply.status(500).send({
          success: false,
          error: {
            message: error.message || 'Failed to get safe zones',
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
  fastify.get(
    '/safe-zones/:id',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const userId = request.user!.userId;
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
      } catch (error: any) {
        logger.error({ error  }, 'Get safe zone error');
        reply.status(500).send({
          success: false,
          error: {
            message: error.message || 'Failed to get safe zone',
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
        const userId = request.user!.userId;
        const { name, centerLatitude, centerLongitude, radius, type } =
          request.body as any;

        const safeZone = await safeZoneService.createSafeZone(
          userId,
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
      } catch (error: any) {
        logger.error({ error  }, 'Create safe zone error');
        reply.status(500).send({
          success: false,
          error: {
            message: error.message || 'Failed to create safe zone',
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
        const userId = request.user!.userId;
        const { id } = request.params as { id: string };
        const updates = request.body as any;

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
      } catch (error: any) {
        logger.error({ error  }, 'Update safe zone error');
        reply.status(500).send({
          success: false,
          error: {
            message: error.message || 'Failed to update safe zone',
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
        const userId = request.user!.userId;
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
      } catch (error: any) {
        logger.error({ error  }, 'Delete safe zone error');
        reply.status(500).send({
          success: false,
          error: {
            message: error.message || 'Failed to delete safe zone',
            code: 'SAFE_ZONE_DELETE_ERROR',
          },
        });
      }
    }
  );

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
        const userId = request.user!.userId;
        const { latitude, longitude } = request.body as any;

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
      } catch (error: any) {
        logger.error({ error  }, 'Check safe zone error');
        reply.status(500).send({
          success: false,
          error: {
            message: error.message || 'Failed to check safe zones',
            code: 'SAFE_ZONE_CHECK_ERROR',
          },
        });
      }
    }
  );
}
