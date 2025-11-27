import { FastifyInstance } from 'fastify';
import emergencyService from '../services/emergency.service';
import locationService from '../services/location.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createEmergencyContactSchema,
  updateEmergencyContactSchema,
  triggerEmergencyAlertSchema,
  validate,
} from '../utils/validation';
import { ApiResponse, EmergencyTriggerReason } from '../types';
import { getAuthUser } from '../utils/auth';
import logger from '../utils/logger';
import { formatError } from '../utils/formatError';

  // Helper to map DB emergency contact row to API-friendly shape
  function mapEmergencyContact(row: any) {
    return {
      id: row.id,
      userId: row.user_id ?? row.userId,
      name: row.name,
      phoneNumber: row.phone_number ?? row.phoneNumber,
      email: row.email,
      relationship: row.relationship,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : row.createdAt,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : row.updatedAt,
    };
  }

  // Helper to map DB emergency alert row to API-friendly shape
  function mapEmergencyAlert(row: any) {
    if (!row) return null;

    // location_snapshot might be stored as JSON string or object
    let locationSnapshot: any = row.location_snapshot ?? row.locationSnapshot;
    if (typeof locationSnapshot === 'string') {
      try {
        locationSnapshot = JSON.parse(locationSnapshot);
      } catch (e) {
        // leave as-is
      }
    }

    return {
      id: row.id,
      userId: row.user_id ?? row.userId,
      contactId: row.contact_id ?? row.contactId,
      triggerReason: row.trigger_reason ?? row.triggerReason,
      locationSnapshot: locationSnapshot
        ? {
            latitude: Number(locationSnapshot.latitude),
            longitude: Number(locationSnapshot.longitude),
            timestamp: locationSnapshot.timestamp
              ? new Date(locationSnapshot.timestamp).toISOString()
              : undefined,
          }
        : undefined,
      sentAt: row.sent_at ? new Date(row.sent_at).toISOString() : row.sentAt,
      deliveredAt: row.delivered_at ? new Date(row.delivered_at).toISOString() : row.deliveredAt,
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at).toISOString() : row.acknowledgedAt,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : row.createdAt,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : row.updatedAt,
    };
  }

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
          data: contacts.map(mapEmergencyContact),
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
          data: mapEmergencyContact(contact),
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
          data: contact ? mapEmergencyContact(contact) : contact,
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
  fastify.post('/emergency/alert', { preHandler: [authMiddleware] },
    async (request, reply) => {
      try {
        const { userId } = getAuthUser(request);
        // Allow calling this endpoint without a body for tests that trigger alert
        // using the user's latest location. Prefer explicit body when provided.
        const body = (request.body || {}) as any;
        let triggerReason: EmergencyTriggerReason | undefined = body.triggerReason;
        // Accept timestamp either as string or Date (DB layer uses Date)
        let locationSnapshot:
          | { latitude: number; longitude: number; timestamp: string | Date }
          | undefined = body.locationSnapshot;

        if (!locationSnapshot) {
          // Fallback to current/latest location
          logger.debug({ userId, body }, 'No locationSnapshot in request body, fetching current location');
          const current = await locationService.getCurrentLocation(userId);
          logger.debug({ userId, current }, 'Fetched current location for emergency trigger');
          if (!current) {
            logger.warn({ userId }, 'No current location available to trigger emergency alert');
            return reply.status(400).send({
              success: false,
              error: { message: 'No location available to trigger alert', code: 'NO_LOCATION' },
            });
          }

          locationSnapshot = {
            latitude: current.latitude,
            longitude: current.longitude,
            timestamp: current.timestamp,
          };
        }

        if (!triggerReason) {
          triggerReason = EmergencyTriggerReason.MANUAL;
        }

        logger.debug({ userId, triggerReason, locationSnapshot }, 'Triggering emergency alerts');

        const alerts = await emergencyService.triggerEmergencyAlert(
          userId,
          triggerReason as EmergencyTriggerReason,
          {
            latitude: locationSnapshot!.latitude,
            longitude: locationSnapshot!.longitude,
            timestamp: new Date(locationSnapshot!.timestamp as any),
          }
        );

        const first = alerts && alerts.length > 0 ? mapEmergencyAlert(alerts[0]) : undefined;
        logger.debug({ userId, alertCount: alerts.length, first }, 'Emergency alerts created');

        const response: ApiResponse = {
          success: true,
          data: first,
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

        const mappedAlerts = alerts.map(mapEmergencyAlert);

        const response: ApiResponse = {
          success: true,
          data: {
            alerts: mappedAlerts,
            pagination: {
              total,
              limit,
              offset,
              hasMore: offset + mappedAlerts.length < total,
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
          data: { alert: mapEmergencyAlert(alert) },
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
