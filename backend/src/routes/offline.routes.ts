import { FastifyInstance } from 'fastify';
import offlineService from '../services/offline.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { syncOfflineActionsSchema, validate } from '../utils/validation';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

export async function offlineRoutes(fastify: FastifyInstance) {
  /**
   * Sync offline actions
   * POST /offline-actions/sync
   */
  fastify.post(
    '/offline-actions/sync',
    {
      preHandler: [authMiddleware, validate(syncOfflineActionsSchema)],
    },
    async (request, reply) => {
      try {
        const userId = request.user!.userId;
        const { actions } = request.body as any;

        const processedActions = actions.map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp),
        }));

        const result = await offlineService.syncOfflineActions(
          userId,
          processedActions
        );

        const response: ApiResponse = {
          success: result.success,
          data: {
            processed: result.processed,
            failed: result.failed,
            errors: result.errors,
          },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: any) {
        logger.error({ error  }, 'Offline sync error');
        reply.status(500).send({
          success: false,
          error: {
            message: error.message || 'Failed to sync offline actions',
            code: 'OFFLINE_SYNC_ERROR',
          },
        });
      }
    }
  );

  /**
   * Get pending offline actions
   * GET /offline-actions/pending
   */
  fastify.get(
    '/offline-actions/pending',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const userId = request.user!.userId;

        const pendingActions = await offlineService.getPendingOfflineActions(userId);

        const response: ApiResponse = {
          success: true,
          data: {
            actions: pendingActions,
            count: pendingActions.length,
          },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: any) {
        logger.error({ error  }, 'Get pending actions error');
        reply.status(500).send({
          success: false,
          error: {
            message: error.message || 'Failed to get pending actions',
            code: 'PENDING_ACTIONS_ERROR',
          },
        });
      }
    }
  );
}
