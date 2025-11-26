import { FastifyInstance } from 'fastify';
import offlineService from '../services/offline.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { syncOfflineActionsSchema, validate } from '../utils/validation';
import { ApiResponse } from '../types';
import { getAuthUser } from '../utils/auth';
import logger from '../utils/logger';
import { formatError } from '../utils/formatError';

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
        const { userId } = getAuthUser(request);
        const { actions } = request.body as {
          actions: Array<{
            actionType: string;
            data: Record<string, unknown>;
            timestamp: string;
          }>;
        };

        const processedActions = actions.map((action) => ({
          ...action,
          actionType: action.actionType as import('../types').OfflineActionType,
          timestamp: new Date(action.timestamp),
        }));

        const result = await offlineService.syncOfflineActions(userId, processedActions);

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
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Offline sync error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to sync offline actions',
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
        const { userId } = getAuthUser(request);

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
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Get pending actions error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to get pending actions',
            code: 'PENDING_ACTIONS_ERROR',
          },
        });
      }
    }
  );
}
