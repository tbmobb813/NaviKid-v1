import db from '../database';
import logger from '../utils/logger';
import { Location, LocationContext } from '../types';

export class LocationService {
  /**
   * Store new location
   */
  public async storeLocation(
    userId: string,
    latitude: number,
    longitude: number,
    accuracy: number | undefined,
    timestamp: Date,
    context: LocationContext = {}
  ): Promise<Location> {
    try {
      const result = await db.query<Location>(
        `INSERT INTO locations (user_id, latitude, longitude, accuracy, timestamp, context)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, latitude, longitude, accuracy ?? null, timestamp, JSON.stringify(context)]
      );

      const location = result.rows[0];

      logger.debug({ userId, locationId: location.id }, 'Location stored');

      return location;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to store location');
      throw error;
    }
  }

  /**
   * Get location history
   */
  public async getLocationHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ locations: Location[]; total: number }> {
    try {
      let query = 'SELECT * FROM locations WHERE user_id = $1';
  const params: unknown[] = [userId];
      let paramIndex = 2;

      if (startDate) {
        query += ` AND timestamp >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND timestamp <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      // Get total count
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Get locations with pagination
      query += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await db.query<Location>(query, params);

      logger.debug(
        {
          userId,
          count: result.rows.length,
          total,
        },
        'Location history retrieved'
      );

      return {
        locations: result.rows,
        total,
      };
    } catch (error) {
      logger.error({ userId, error }, 'Failed to get location history');
      throw error;
    }
  }

  /**
   * Get current (latest) location
   */
  public async getCurrentLocation(userId: string): Promise<Location | null> {
    try {
      const result = await db.query<Location>(
        `SELECT * FROM locations
         WHERE user_id = $1
         ORDER BY timestamp DESC
         LIMIT 1`,
        [userId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to get current location');
      throw error;
    }
  }

  /**
   * Delete specific location
   */
  public async deleteLocation(userId: string, locationId: string): Promise<boolean> {
    try {
      const result = await db.query(
        'DELETE FROM locations WHERE id = $1 AND user_id = $2',
        [locationId, userId]
      );

      const deleted = (result.rowCount ?? 0) > 0;

      if (deleted) {
        logger.info({ userId, locationId }, 'Location deleted');
      }

      return deleted;
    } catch (error) {
      logger.error({ userId, locationId, error }, 'Failed to delete location');
      throw error;
    }
  }

  /**
   * Delete old locations (for data retention compliance)
   */
  public async deleteOldLocations(retentionDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await db.query('DELETE FROM locations WHERE created_at < $1', [
        cutoffDate,
      ]);

      const deletedCount = result.rowCount ?? 0;

      logger.info({ deletedCount, cutoffDate }, 'Old locations deleted');

      return deletedCount;
    } catch (error) {
      logger.error({ error }, 'Failed to delete old locations');
      throw error;
    }
  }

  /**
   * Get locations within a time range
   */
  public async getLocationsByTimeRange(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Location[]> {
    try {
      const result = await db.query<Location>(
        `SELECT * FROM locations
         WHERE user_id = $1
         AND timestamp BETWEEN $2 AND $3
         ORDER BY timestamp ASC`,
        [userId, startTime, endTime]
      );

      return result.rows;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to get locations by time range');
      throw error;
    }
  }

  /**
   * Batch store locations (for offline sync)
   */
  public async batchStoreLocations(
    userId: string,
    locations: Array<{
      latitude: number;
      longitude: number;
      accuracy?: number;
      timestamp: Date;
      context?: LocationContext;
    }>
  ): Promise<Location[]> {
    try {
      const storedLocations: Location[] = [];

      // Use transaction for batch insert
      await db.transaction(async (client) => {
        for (const loc of locations) {
          const result = await client.query<Location>(
            `INSERT INTO locations (user_id, latitude, longitude, accuracy, timestamp, context)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
              userId,
              loc.latitude,
              loc.longitude,
              loc.accuracy,
              loc.timestamp,
              JSON.stringify(loc.context || {}),
            ]
          );
          storedLocations.push(result.rows[0]);
        }
      });

      logger.info(
        {
          userId,
          count: storedLocations.length,
        },
        'Batch locations stored'
      );

      return storedLocations;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to batch store locations');
      throw error;
    }
  }
}

export default new LocationService();
