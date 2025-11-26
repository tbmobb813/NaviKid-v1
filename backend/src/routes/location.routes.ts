import { FastifyInstance } from 'fastify';
import locationService from '../services/location.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  storeLocationSchema,
  batchStoreLocationsSchema,
  validate,
} from '../utils/validation';
import { ApiResponse } from '../types';
import { getAuthUser } from '../utils/auth';
import logger from '../utils/logger';
import { formatError } from '../utils/formatError';

export async function locationRoutes(fastify: FastifyInstance) {
  /**
   * Store new location
   * POST /locations
   */
  fastify.post(
    '/locations',
    {
      preHandler: [authMiddleware, validate(storeLocationSchema)],
    },
    async (request, reply) => {
      try {
        const { userId } = getAuthUser(request);
        const { latitude, longitude, accuracy, timestamp, context } = request.body as {
          latitude: number;
          longitude: number;
          accuracy?: number;
          timestamp: string;
          context?: Record<string, unknown>;
        };

        const location = await locationService.storeLocation(
          userId,
          latitude,
          longitude,
          accuracy,
          new Date(timestamp),
          context
        );

        const response: ApiResponse = {
          success: true,
          data: { location },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(201).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Store location error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to store location',
            code: 'LOCATION_STORE_ERROR',
          },
        });
      }
    }
  );

  /**
   * Get location history
   * GET /locations
   */
  fastify.get(
    '/locations',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { userId } = getAuthUser(request);
        const query = request.query as Record<string, string | undefined>;

        const startDate = query.startDate ? new Date(query.startDate) : undefined;
        const endDate = query.endDate ? new Date(query.endDate) : undefined;
        const limit = query.limit ? parseInt(query.limit) : 100;
        const offset = query.offset ? parseInt(query.offset) : 0;

        const { locations, total } = await locationService.getLocationHistory(
          userId,
          startDate,
          endDate,
          limit,
          offset
        );

        const response: ApiResponse = {
          success: true,
          data: {
            locations,
            pagination: {
              total,
              limit,
              offset,
              hasMore: offset + locations.length < total,
            },
          },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Get location history error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to get location history',
            code: 'LOCATION_HISTORY_ERROR',
          },
        });
      }
    }
  );

  /**
   * Get current location
   * GET /locations/current
   */
  fastify.get(
    '/locations/current',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { userId } = getAuthUser(request);

        const location = await locationService.getCurrentLocation(userId);

        if (!location) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'No location found',
              code: 'LOCATION_NOT_FOUND',
            },
          });
        }

        const response: ApiResponse = {
          success: true,
          data: { location },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Get current location error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to get current location',
            code: 'CURRENT_LOCATION_ERROR',
          },
        });
      }
    }
  );

  /**
   * Delete location
   * DELETE /locations/:id
   */
  fastify.delete(
    '/locations/:id',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { userId } = getAuthUser(request);
        const { id } = request.params as { id: string };

        const deleted = await locationService.deleteLocation(userId, id);

        if (!deleted) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'Location not found',
              code: 'LOCATION_NOT_FOUND',
            },
          });
        }

        const response: ApiResponse = {
          success: true,
          data: { message: 'Location deleted successfully' },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Delete location error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to delete location',
            code: 'LOCATION_DELETE_ERROR',
          },
        });
      }
    }
  );

  /**
   * Batch store locations (for offline sync)
   * POST /locations/batch
   */
  fastify.post(
    '/locations/batch',
    {
      preHandler: [authMiddleware, validate(batchStoreLocationsSchema)],
    },
    async (request, reply) => {
      try {
        const { userId } = getAuthUser(request);
        const { locations } = request.body as {
          locations: Array<{
            latitude: number;
            longitude: number;
            accuracy?: number;
            timestamp: string;
            context?: Record<string, unknown>;
          }>;
        };

        const processedLocations = locations.map((loc) => ({
          ...loc,
          timestamp: new Date(loc.timestamp),
        }));

        const storedLocations = await locationService.batchStoreLocations(
          userId,
          processedLocations
        );

        const response: ApiResponse = {
          success: true,
          data: {
            locations: storedLocations,
            count: storedLocations.length,
          },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(201).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Batch store locations error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to batch store locations',
            code: 'BATCH_LOCATION_ERROR',
          },
        });
      }
    }
  );
}
