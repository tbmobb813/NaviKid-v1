import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { query } from '../db/connection';
import { getAuthUser } from '../utils/auth';

// Request schemas
const createLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  altitude: z.number().optional(),
  altitudeAccuracy: z.number().optional(),
  heading: z.number().optional(),
  speed: z.number().optional(),
  timestamp: z.string().datetime().optional(),
});

const getLocationsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  limit: z.string().transform(Number).default('100'),
  offset: z.string().transform(Number).default('0'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export async function locationRoutes(server: FastifyInstance) {
  /**
   * POST /api/locations
   * Store a location update
   */
  server.post('/', {
    preHandler: [server.authenticate as any],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getAuthUser(request);
    const body = createLocationSchema.parse(request.body);

    const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

    const result = await query(
      `INSERT INTO location_history
       (user_id, latitude, longitude, accuracy, altitude, altitude_accuracy, heading, speed, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, user_id, latitude, longitude, timestamp`,
      [
        user.userId,
        body.latitude,
        body.longitude,
        body.accuracy || null,
        body.altitude || null,
        body.altitudeAccuracy || null,
        body.heading || null,
        body.speed || null,
        timestamp,
      ]
    );

    const location = result.rows[0];

    reply.code(201).send({
      id: location.id,
      userId: location.user_id,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: location.timestamp,
    });
  });

  /**
   * GET /api/locations
   * Get location history
   */
  server.get('/', {
    preHandler: [server.authenticate as any],
  }, async (request: FastifyRequest<{
    Querystring: z.infer<typeof getLocationsQuerySchema>
  }>, reply: FastifyReply) => {
    const user = getAuthUser(request);
    const query_params = getLocationsQuerySchema.parse(request.query);

    // Determine which user's locations to fetch
    let targetUserId = user.userId;

    if (query_params.userId) {
      // Parent trying to access child's location
      if (user.role !== 'parent') {
        return reply.forbidden('Only parents can access other users\' locations');
      }

      // Verify parent-child relationship
      const relationshipCheck = await query(
        'SELECT id FROM user_relationships WHERE parent_id = $1 AND child_id = $2 AND status = \'active\'',
        [user.userId, query_params.userId]
      );

      if (relationshipCheck.rowCount === 0) {
        return reply.forbidden('You do not have access to this user\'s locations');
      }

      targetUserId = query_params.userId;
    }

    // Build query
    const conditions: string[] = ['user_id = $1'];
    const values: any[] = [targetUserId];
    let paramCount = 2;

    if (query_params.startDate) {
      conditions.push(`timestamp >= $${paramCount++}`);
      values.push(new Date(query_params.startDate));
    }

    if (query_params.endDate) {
      conditions.push(`timestamp <= $${paramCount++}`);
      values.push(new Date(query_params.endDate));
    }

    values.push(query_params.limit);
    values.push(query_params.offset);

    const result = await query(
      `SELECT id, user_id, latitude, longitude, accuracy, altitude,
              altitude_accuracy, heading, speed, timestamp, created_at
       FROM location_history
       WHERE ${conditions.join(' AND ')}
       ORDER BY timestamp DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      values
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM location_history
       WHERE ${conditions.join(' AND ')}`,
      values.slice(0, -2)
    );

    reply.send({
      locations: result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        latitude: row.latitude,
        longitude: row.longitude,
        accuracy: row.accuracy,
        altitude: row.altitude,
        altitudeAccuracy: row.altitude_accuracy,
        heading: row.heading,
        speed: row.speed,
        timestamp: row.timestamp,
      })),
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: query_params.limit,
        offset: query_params.offset,
      },
    });
  });

  /**
   * GET /api/locations/latest/:userId?
   * Get latest location for user or child
   */
  server.get('/latest/:userId?', {
    preHandler: [server.authenticate as any],
  }, async (request: FastifyRequest<{
    Params: { userId?: string }
  }>, reply: FastifyReply) => {
    const user = getAuthUser(request);
    let targetUserId = user.userId;

    if (request.params.userId) {
      if (user.role !== 'parent') {
        return reply.forbidden('Only parents can access other users\' locations');
      }

      // Verify parent-child relationship
      const relationshipCheck = await query(
        'SELECT id FROM user_relationships WHERE parent_id = $1 AND child_id = $2 AND status = \'active\'',
        [user.userId, request.params.userId]
      );

      if (relationshipCheck.rowCount === 0) {
        return reply.forbidden('You do not have access to this user\'s location');
      }

      targetUserId = request.params.userId;
    }

    const result = await query(
      `SELECT id, user_id, latitude, longitude, accuracy, altitude,
              altitude_accuracy, heading, speed, timestamp
       FROM location_history
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [targetUserId]
    );

    if (result.rowCount === 0) {
      return reply.notFound('No location data found');
    }

    const location = result.rows[0];

    reply.send({
      id: location.id,
      userId: location.user_id,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      altitudeAccuracy: location.altitude_accuracy,
      heading: location.heading,
      speed: location.speed,
      timestamp: location.timestamp,
    });
  });

  /**
   * DELETE /api/locations/:id
   * Delete a specific location entry
   */
  server.delete('/:id', {
    preHandler: [server.authenticate as any],
  }, async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    const user = getAuthUser(request);
    const { id } = request.params;

    const result = await query(
      'DELETE FROM location_history WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, user.userId]
    );

    if (result.rowCount === 0) {
      return reply.notFound('Location not found or you do not have permission to delete it');
    }

    reply.send({ message: 'Location deleted successfully' });
  });

  /**
   * DELETE /api/locations
   * Delete all location history for current user
   */
  server.delete('/', {
    preHandler: [server.authenticate as any],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getAuthUser(request);

    const result = await query(
      'DELETE FROM location_history WHERE user_id = $1',
      [user.userId]
    );

    reply.send({
      message: 'Location history deleted successfully',
      count: result.rowCount,
    });
  });
}
