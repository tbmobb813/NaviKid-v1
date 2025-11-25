import { FastifyInstance, FastifyRequest, FastifyReply, RouteShorthandOptions } from 'fastify';
import { z } from 'zod';
import { query } from '../db/connection';
import { getAuthUser } from '../utils/auth';

// Request schemas
const createSafeZoneSchema = z.object({
  childId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(1), // meters
  notifyOnEntry: z.boolean().default(true),
  notifyOnExit: z.boolean().default(true),
});

const updateSafeZoneSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(1).optional(),
  notifyOnEntry: z.boolean().optional(),
  notifyOnExit: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const createGeofenceEventSchema = z.object({
  safeZoneId: z.string().uuid(),
  eventType: z.enum(['entry', 'exit']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  timestamp: z.string().datetime().optional(),
});

export async function geofenceRoutes(server: FastifyInstance) {
  // central auth options to satisfy Fastify overloads and avoid repeating casts
  const authOpts: RouteShorthandOptions = { preHandler: [server.authenticate] } as RouteShorthandOptions;
  /**
   * POST /api/safe-zones
   * Create a new safe zone (geofence)
   */
  server.post('/', authOpts, async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);
      const body = createSafeZoneSchema.parse(request.body);

      if (user.role !== 'parent') {
        return reply.forbidden('Only parents can create safe zones');
      }

      // Verify parent-child relationship
      const relationshipCheck = await query(
        "SELECT id FROM user_relationships WHERE parent_id = $1 AND child_id = $2 AND status = 'active'",
        [user.userId, body.childId]
      );

      if (relationshipCheck.rowCount === 0) {
        return reply.forbidden(
          'You do not have access to create safe zones for this child'
        );
      }

      const result = await query(
        `INSERT INTO safe_zones
       (parent_id, child_id, name, description, latitude, longitude, radius, notify_on_entry, notify_on_exit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, parent_id, child_id, name, description, latitude, longitude, radius,
                 notify_on_entry, notify_on_exit, is_active, created_at`,
        [
          user.userId,
          body.childId,
          body.name,
          body.description || null,
          body.latitude,
          body.longitude,
          body.radius,
          body.notifyOnEntry,
          body.notifyOnExit,
        ]
      );

      const safeZone = result.rows[0];

      reply.code(201).send({
        id: safeZone.id,
        parentId: safeZone.parent_id,
        childId: safeZone.child_id,
        name: safeZone.name,
        description: safeZone.description,
        latitude: safeZone.latitude,
        longitude: safeZone.longitude,
        radius: safeZone.radius,
        notifyOnEntry: safeZone.notify_on_entry,
        notifyOnExit: safeZone.notify_on_exit,
        isActive: safeZone.is_active,
        createdAt: safeZone.created_at,
      });
    }
  );

  /**
   * GET /api/safe-zones
   * Get all safe zones for current user
   */
  server.get('/', authOpts, async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);

      let result;

      if (user.role === 'parent') {
        // Get all safe zones created by this parent
        result = await query(
          `SELECT sz.id, sz.parent_id, sz.child_id, sz.name, sz.description,
                sz.latitude, sz.longitude, sz.radius, sz.notify_on_entry, sz.notify_on_exit,
                sz.is_active, sz.created_at, sz.updated_at,
                u.email as child_email, u.first_name as child_first_name, u.last_name as child_last_name
         FROM safe_zones sz
         JOIN users u ON sz.child_id = u.id
         WHERE sz.parent_id = $1
         ORDER BY sz.created_at DESC`,
          [user.userId]
        );
      } else {
        // Get all safe zones for this child
        result = await query(
          `SELECT sz.id, sz.parent_id, sz.child_id, sz.name, sz.description,
                sz.latitude, sz.longitude, sz.radius, sz.notify_on_entry, sz.notify_on_exit,
                sz.is_active, sz.created_at, sz.updated_at,
                u.email as parent_email, u.first_name as parent_first_name, u.last_name as parent_last_name
         FROM safe_zones sz
         JOIN users u ON sz.parent_id = u.id
         WHERE sz.child_id = $1 AND sz.is_active = TRUE
         ORDER BY sz.created_at DESC`,
          [user.userId]
        );
      }

      reply.send({
        safeZones: result.rows.map((row) => ({
          id: row.id,
          parentId: row.parent_id,
          childId: row.child_id,
          name: row.name,
          description: row.description,
          latitude: row.latitude,
          longitude: row.longitude,
          radius: row.radius,
          notifyOnEntry: row.notify_on_entry,
          notifyOnExit: row.notify_on_exit,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          ...(user.role === 'parent'
            ? {
                childEmail: row.child_email,
                childFirstName: row.child_first_name,
                childLastName: row.child_last_name,
              }
            : {
                parentEmail: row.parent_email,
                parentFirstName: row.parent_first_name,
                parentLastName: row.parent_last_name,
              }),
        })),
      });
    }
  );

  /**
   * GET /api/safe-zones/:id
   * Get a specific safe zone
   */
  server.get('/:id', authOpts, async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);
  const { id } = request.params as { id: string };

      const result = await query(
        `SELECT sz.*,
              p.email as parent_email, p.first_name as parent_first_name, p.last_name as parent_last_name,
              c.email as child_email, c.first_name as child_first_name, c.last_name as child_last_name
       FROM safe_zones sz
       JOIN users p ON sz.parent_id = p.id
       JOIN users c ON sz.child_id = c.id
       WHERE sz.id = $1 AND (sz.parent_id = $2 OR sz.child_id = $2)`,
        [id, user.userId]
      );

      if (result.rowCount === 0) {
        return reply.notFound('Safe zone not found');
      }

      const safeZone = result.rows[0];

      reply.send({
        id: safeZone.id,
        parentId: safeZone.parent_id,
        childId: safeZone.child_id,
        name: safeZone.name,
        description: safeZone.description,
        latitude: safeZone.latitude,
        longitude: safeZone.longitude,
        radius: safeZone.radius,
        notifyOnEntry: safeZone.notify_on_entry,
        notifyOnExit: safeZone.notify_on_exit,
        isActive: safeZone.is_active,
        createdAt: safeZone.created_at,
        updatedAt: safeZone.updated_at,
        parent: {
          email: safeZone.parent_email,
          firstName: safeZone.parent_first_name,
          lastName: safeZone.parent_last_name,
        },
        child: {
          email: safeZone.child_email,
          firstName: safeZone.child_first_name,
          lastName: safeZone.child_last_name,
        },
      });
    }
  );

  /**
   * PATCH /api/safe-zones/:id
   * Update a safe zone
   */
  server.patch('/:id', authOpts, async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);
  const { id } = request.params as { id: string };
      const body = updateSafeZoneSchema.parse(request.body);

      if (user.role !== 'parent') {
        return reply.forbidden('Only parents can update safe zones');
      }

      // Build update query
      const updates: string[] = [];
  const values: unknown[] = [];
      let paramCount = 1;

      if (body.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(body.name);
      }

      if (body.description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(body.description);
      }

      if (body.latitude !== undefined) {
        updates.push(`latitude = $${paramCount++}`);
        values.push(body.latitude);
      }

      if (body.longitude !== undefined) {
        updates.push(`longitude = $${paramCount++}`);
        values.push(body.longitude);
      }

      if (body.radius !== undefined) {
        updates.push(`radius = $${paramCount++}`);
        values.push(body.radius);
      }

      if (body.notifyOnEntry !== undefined) {
        updates.push(`notify_on_entry = $${paramCount++}`);
        values.push(body.notifyOnEntry);
      }

      if (body.notifyOnExit !== undefined) {
        updates.push(`notify_on_exit = $${paramCount++}`);
        values.push(body.notifyOnExit);
      }

      if (body.isActive !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(body.isActive);
      }

      if (updates.length === 0) {
        return reply.badRequest('No fields to update');
      }

      values.push(id);
      values.push(user.userId);

      const result = await query(
        `UPDATE safe_zones
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount++} AND parent_id = $${paramCount}
       RETURNING *`,
        values
      );

      if (result.rowCount === 0) {
        return reply.notFound(
          'Safe zone not found or you do not have permission to update it'
        );
      }

      const safeZone = result.rows[0];

      reply.send({
        id: safeZone.id,
        parentId: safeZone.parent_id,
        childId: safeZone.child_id,
        name: safeZone.name,
        description: safeZone.description,
        latitude: safeZone.latitude,
        longitude: safeZone.longitude,
        radius: safeZone.radius,
        notifyOnEntry: safeZone.notify_on_entry,
        notifyOnExit: safeZone.notify_on_exit,
        isActive: safeZone.is_active,
        updatedAt: safeZone.updated_at,
      });
    }
  );

  /**
   * DELETE /api/safe-zones/:id
   * Delete a safe zone
   */
  server.delete('/:id', authOpts, async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);
  const { id } = request.params as { id: string };

      if (user.role !== 'parent') {
        return reply.forbidden('Only parents can delete safe zones');
      }

      const result = await query(
        'DELETE FROM safe_zones WHERE id = $1 AND parent_id = $2 RETURNING id',
        [id, user.userId]
      );

      if (result.rowCount === 0) {
        return reply.notFound(
          'Safe zone not found or you do not have permission to delete it'
        );
      }

      reply.send({ message: 'Safe zone deleted successfully' });
    }
  );

  /**
   * POST /api/safe-zones/events
   * Record a geofence event (entry/exit)
   */
  server.post('/events', authOpts, async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);
      const body = createGeofenceEventSchema.parse(request.body);

      // Verify safe zone exists and user has access
      const safeZoneCheck = await query(
        'SELECT id, parent_id, child_id FROM safe_zones WHERE id = $1',
        [body.safeZoneId]
      );

      if (safeZoneCheck.rowCount === 0) {
        return reply.notFound('Safe zone not found');
      }

      const safeZone = safeZoneCheck.rows[0];

      // Only the child associated with the safe zone can create events
      if (user.userId !== safeZone.child_id) {
        return reply.forbidden(
          'You do not have permission to create events for this safe zone'
        );
      }

      const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

      const result = await query(
        `INSERT INTO geofence_events
       (safe_zone_id, user_id, event_type, latitude, longitude, accuracy, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, safe_zone_id, user_id, event_type, timestamp`,
        [
          body.safeZoneId,
          user.userId,
          body.eventType,
          body.latitude,
          body.longitude,
          body.accuracy || null,
          timestamp,
        ]
      );

      const event = result.rows[0];

      // TODO: Send push notification to parent

      reply.code(201).send({
        id: event.id,
        safeZoneId: event.safe_zone_id,
        userId: event.user_id,
        eventType: event.event_type,
        timestamp: event.timestamp,
      });
    }
  );

  /**
   * GET /api/safe-zones/:id/events
   * Get events for a specific safe zone
   */
  server.get('/:id/events', authOpts, async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);
  const { id } = request.params as { id: string };
  const q = request.query as { limit?: string; offset?: string };
  const limit = parseInt(q.limit || '50');
  const offset = parseInt(q.offset || '0');

      // Verify safe zone access
      const safeZoneCheck = await query(
        'SELECT id FROM safe_zones WHERE id = $1 AND (parent_id = $2 OR child_id = $2)',
        [id, user.userId]
      );

      if (safeZoneCheck.rowCount === 0) {
        return reply.notFound('Safe zone not found or you do not have access');
      }

      const result = await query(
        `SELECT id, safe_zone_id, user_id, event_type, latitude, longitude,
              accuracy, notification_sent, timestamp
       FROM geofence_events
       WHERE safe_zone_id = $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );

      reply.send({
        events: result.rows.map((row) => ({
          id: row.id,
          safeZoneId: row.safe_zone_id,
          userId: row.user_id,
          eventType: row.event_type,
          latitude: row.latitude,
          longitude: row.longitude,
          accuracy: row.accuracy,
          notificationSent: row.notification_sent,
          timestamp: row.timestamp,
        })),
        pagination: {
          limit,
          offset,
        },
      });
    }
  );
}
