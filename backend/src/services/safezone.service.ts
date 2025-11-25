import db from '../database';
import logger from '../utils/logger';
import { SafeZone, SafeZoneType, Location } from '../types';

export class SafeZoneService {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Create safe zone
   */
  public async createSafeZone(
    userId: string,
    name: string,
    centerLatitude: number,
    centerLongitude: number,
    radius: number,
    type: SafeZoneType = SafeZoneType.CUSTOM
  ): Promise<SafeZone> {
    try {
      const result = await db.query<SafeZone>(
        `INSERT INTO safe_zones (user_id, name, center_latitude, center_longitude, radius, type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, name, centerLatitude, centerLongitude, radius, type]
      );

      const safeZone = result.rows[0];

      logger.info({ userId, safeZoneId: safeZone.id }, 'Safe zone created');

      return safeZone;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to create safe zone');
      throw error;
    }
  }

  /**
   * Get all safe zones for a user
   */
  public async getSafeZones(userId: string): Promise<SafeZone[]> {
    try {
      const result = await db.query<SafeZone>(
        'SELECT * FROM safe_zones WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      return result.rows;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to get safe zones');
      throw error;
    }
  }

  /**
   * Get safe zone by ID
   */
  public async getSafeZoneById(
    userId: string,
    safeZoneId: string
  ): Promise<SafeZone | null> {
    try {
      const result = await db.query<SafeZone>(
        'SELECT * FROM safe_zones WHERE id = $1 AND user_id = $2',
        [safeZoneId, userId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error({ userId, safeZoneId, error }, 'Failed to get safe zone');
      throw error;
    }
  }

  /**
   * Update safe zone
   */
  public async updateSafeZone(
    userId: string,
    safeZoneId: string,
    updates: {
      name?: string;
      centerLatitude?: number;
      centerLongitude?: number;
      radius?: number;
      type?: SafeZoneType;
    }
  ): Promise<SafeZone | null> {
    try {
      const fields: string[] = [];
  const values: unknown[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${paramIndex}`);
        values.push(updates.name);
        paramIndex++;
      }

      if (updates.centerLatitude !== undefined) {
        fields.push(`center_latitude = $${paramIndex}`);
        values.push(updates.centerLatitude);
        paramIndex++;
      }

      if (updates.centerLongitude !== undefined) {
        fields.push(`center_longitude = $${paramIndex}`);
        values.push(updates.centerLongitude);
        paramIndex++;
      }

      if (updates.radius !== undefined) {
        fields.push(`radius = $${paramIndex}`);
        values.push(updates.radius);
        paramIndex++;
      }

      if (updates.type !== undefined) {
        fields.push(`type = $${paramIndex}`);
        values.push(updates.type);
        paramIndex++;
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(safeZoneId, userId);

      const query = `
        UPDATE safe_zones
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await db.query<SafeZone>(query, values);

      if (result.rows.length > 0) {
        logger.info({ userId, safeZoneId }, 'Safe zone updated');
        return result.rows[0];
      }

      return null;
    } catch (error) {
      logger.error({ userId, safeZoneId, error }, 'Failed to update safe zone');
      throw error;
    }
  }

  /**
   * Delete safe zone
   */
  public async deleteSafeZone(userId: string, safeZoneId: string): Promise<boolean> {
    try {
      const result = await db.query(
        'DELETE FROM safe_zones WHERE id = $1 AND user_id = $2',
        [safeZoneId, userId]
      );

      const deleted = (result.rowCount ?? 0) > 0;

      if (deleted) {
        logger.info({ userId, safeZoneId }, 'Safe zone deleted');
      }

      return deleted;
    } catch (error) {
      logger.error({ userId, safeZoneId, error }, 'Failed to delete safe zone');
      throw error;
    }
  }

  /**
   * Check if location is inside safe zone
   */
  public isInsideSafeZone(
    location: { latitude: number; longitude: number },
    safeZone: SafeZone
  ): boolean {
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      safeZone.center_latitude,
      safeZone.center_longitude
    );

    return distance <= safeZone.radius;
  }

  /**
   * Check if location is inside any safe zone
   */
  public async checkLocationInSafeZones(
    userId: string,
    latitude: number,
    longitude: number
  ): Promise<{
    isInSafeZone: boolean;
    safeZones: SafeZone[];
  }> {
    try {
      const safeZones = await this.getSafeZones(userId);
      const matchingSafeZones: SafeZone[] = [];

      for (const zone of safeZones) {
        if (this.isInsideSafeZone({ latitude, longitude }, zone)) {
          matchingSafeZones.push(zone);
        }
      }

      return {
        isInSafeZone: matchingSafeZones.length > 0,
        safeZones: matchingSafeZones,
      };
    } catch (error) {
      logger.error({ userId, error }, 'Failed to check location in safe zones');
      throw error;
    }
  }

  /**
   * Detect geofence violations
   * Returns safe zones that the user has left
   */
  public async detectGeofenceViolations(
    userId: string,
    previousLocation: Location,
    currentLocation: Location
  ): Promise<SafeZone[]> {
    try {
      const safeZones = await this.getSafeZones(userId);
      const violations: SafeZone[] = [];

      for (const zone of safeZones) {
        const wasInside = this.isInsideSafeZone(
          {
            latitude: previousLocation.latitude,
            longitude: previousLocation.longitude,
          },
          zone
        );

        const isInside = this.isInsideSafeZone(
          {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          zone
        );

        // Violation: was inside, now outside
        if (wasInside && !isInside) {
          violations.push(zone);
        }
      }

      if (violations.length > 0) {
        logger.warn(
          {
            userId,
            violationCount: violations.length,
          },
          'Geofence violations detected'
        );
      }

      return violations;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to detect geofence violations');
      throw error;
    }
  }
}

export default new SafeZoneService();
