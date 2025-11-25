import { FastifyInstance } from 'fastify';
import emergencyService from '../services/emergency.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createEmergencyContactSchema,
  updateEmergencyContactSchema,
  triggerEmergencyAlertSchema,
  validate,
} from '../utils/validation';
import { ApiResponse, EmergencyTriggerReason, JWTPayload } from '../types';
import { getAuthUser } from '../utils/auth';
import logger from '../utils/logger';
import { formatError } from '../utils/formatError';

export async function emergencyRoutes(fastify: FastifyInstance) {
  /**
   * Get all emergency contacts
   * GET /emergency-contacts
   */
  fastify.get(
    '/emergency-contacts',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
  const { userId } = getAuthUser(request);

        const contacts = await emergencyService.getEmergencyContacts(userId);

        const response: ApiResponse = {
          success: true,
          data: { contacts },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Get emergency contacts error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to get emergency contacts',
            code: 'EMERGENCY_CONTACT_GET_ERROR',
          },
        });
      }
    }
  );

  /**
   * Add emergency contact
   * POST /emergency-contacts
   */
  fastify.post(
    '/emergency-contacts',
    {
      preHandler: [authMiddleware, validate(createEmergencyContactSchema)],
    },
    async (request, reply) => {
      try {
  const { userId } = getAuthUser(request);
        const { name, phoneNumber, email, relationship } = request.body as {
          name: string;
          phoneNumber: string;
          email: string;
          relationship: string;
        };

        const contact = await emergencyService.addEmergencyContact(
          userId,
          name,
          phoneNumber,
          email,
          relationship
        );

        const response: ApiResponse = {
          success: true,
          data: { contact },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(201).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Add emergency contact error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to add emergency contact',
            code: 'EMERGENCY_CONTACT_ADD_ERROR',
          },
        });
      }
    }
  );

  /**
   * Update emergency contact
   * PUT /emergency-contacts/:id
   */
  fastify.put(
    '/emergency-contacts/:id',
    {
      preHandler: [authMiddleware, validate(updateEmergencyContactSchema)],
    },
    async (request, reply) => {
      try {
  const { userId } = getAuthUser(request);
        const { id } = request.params as { id: string };
        const updates = request.body as Partial<{
          name: string;
          phoneNumber: string;
          email: string;
          relationship: string;
        }>;

        const contact = await emergencyService.updateEmergencyContact(
          userId,
          id,
          updates
        );

        if (!contact) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'Emergency contact not found',
              code: 'EMERGENCY_CONTACT_NOT_FOUND',
            },
          });
        }

        const response: ApiResponse = {
          success: true,
          data: { contact },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Update emergency contact error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to update emergency contact',
            code: 'EMERGENCY_CONTACT_UPDATE_ERROR',
          },
        });
      }
    }
  );

  /**
   * Delete emergency contact
   * DELETE /emergency-contacts/:id
   */
  fastify.delete(
    '/emergency-contacts/:id',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
  const { userId } = getAuthUser(request);
        const { id } = request.params as { id: string };

        const deleted = await emergencyService.deleteEmergencyContact(userId, id);

        if (!deleted) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'Emergency contact not found',
              code: 'EMERGENCY_CONTACT_NOT_FOUND',
            },
          });
        }

        const response: ApiResponse = {
          success: true,
          data: { message: 'Emergency contact deleted successfully' },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Delete emergency contact error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to delete emergency contact',
            code: 'EMERGENCY_CONTACT_DELETE_ERROR',
          },
        });
      }
    }
  );

  /**
   * Trigger emergency alert
   * POST /emergency/alert
   */
  fastify.post(
    '/emergency/alert',
    {
      preHandler: [authMiddleware, validate(triggerEmergencyAlertSchema)],
    },
    async (request, reply) => {
      try {
  const { userId } = getAuthUser(request);
        const { triggerReason, locationSnapshot } = request.body as {
          triggerReason: EmergencyTriggerReason;
          locationSnapshot: { latitude: number; longitude: number; timestamp: string };
        };

        const alerts = await emergencyService.triggerEmergencyAlert(
          userId,
          triggerReason as EmergencyTriggerReason,
          {
            latitude: locationSnapshot.latitude,
            longitude: locationSnapshot.longitude,
            timestamp: new Date(locationSnapshot.timestamp),
          }
        );

        const response: ApiResponse = {
          success: true,
          data: {
            alerts,
            count: alerts.length,
            message: `Emergency alert sent to ${alerts.length} contact(s)`,
          },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(201).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Trigger emergency alert error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to trigger emergency alert',
            code: 'EMERGENCY_ALERT_TRIGGER_ERROR',
          },
        });
      }
    }
  );

  /**
   * Get emergency alert history
   * GET /emergency/alerts
   */
  fastify.get(
    '/emergency/alerts',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
  const { userId } = getAuthUser(request);
  const query = request.query as { limit?: string; offset?: string };

  const limit = query.limit ? parseInt(query.limit, 10) : 50;
  const offset = query.offset ? parseInt(query.offset, 10) : 0;

        const { alerts, total } = await emergencyService.getEmergencyAlertHistory(
          userId,
          limit,
          offset
        );

        const response: ApiResponse = {
          success: true,
          data: {
            alerts,
            pagination: {
              total,
              limit,
              offset,
              hasMore: offset + alerts.length < total,
            },
          },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Get alert history error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to get alert history',
            code: 'ALERT_HISTORY_ERROR',
          },
        });
      }
    }
  );

  /**
   * Acknowledge emergency alert
   * POST /emergency/alerts/:id/acknowledge
   */
  fastify.post(
    '/emergency/alerts/:id/acknowledge',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
  const { userId } = getAuthUser(request);
        const { id } = request.params as { id: string };

        const alert = await emergencyService.acknowledgeAlert(userId, id);

        if (!alert) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'Emergency alert not found',
              code: 'ALERT_NOT_FOUND',
            },
          });
        }

        const response: ApiResponse = {
          success: true,
          data: { alert },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Acknowledge alert error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Failed to acknowledge alert',
            code: 'ALERT_ACKNOWLEDGE_ERROR',
          },
        });
      }
    }
  );
}
