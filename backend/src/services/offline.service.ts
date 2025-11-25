import db from '../database';
import logger from '../utils/logger';
import { formatError } from '../utils/formatError';
import { OfflineAction, OfflineActionType } from '../types';
import locationService from './location.service';

export class OfflineService {
  /**
   * Store offline action
   */
  public async storeOfflineAction(
    userId: string,
    actionType: OfflineActionType,
    data: unknown
  ): Promise<OfflineAction> {
    try {
      const result = await db.query<OfflineAction>(
        `INSERT INTO offline_actions (user_id, action_type, data)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, actionType, JSON.stringify(data)]
      );

      const action = result.rows[0];

      logger.debug({ userId, actionId: action.id }, 'Offline action stored');

      return action;
    } catch (error: unknown) {
      const { errorObj } = formatError(error);
      logger.error({ userId, error: errorObj }, 'Failed to store offline action');
      throw error;
    }
  }

  /**
   * Sync offline actions
   */
  public async syncOfflineActions(
    userId: string,
    actions: Array<{
      actionType: OfflineActionType;
      data: unknown;
      timestamp: Date;
    }>
  ): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    let processed = 0;
    let failed = 0;
    const errors: Array<{ index: number; error: string }> = [];

    try {
      logger.info({ userId, actionCount: actions.length }, 'Starting offline sync');

      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];

        try {
          await this.processOfflineAction(userId, action);
          processed++;
        } catch (error: unknown) {
          failed++;
          const { message, errorObj } = formatError(error);
          errors.push({
            index: i,
            error: message || 'Unknown error',
          });
          logger.error(
            {
              userId,
              index: i,
              error: errorObj,
            },
            'Failed to process offline action'
          );
        }
      }

      logger.info({ userId, processed, failed }, 'Offline sync completed');

      return {
        success: failed === 0,
        processed,
        failed,
        errors,
      };
    } catch (error: unknown) {
      const { errorObj } = formatError(error);
      logger.error({ userId, error: errorObj }, 'Offline sync failed');
      throw error;
    }
  }

  /**
   * Process individual offline action
   */
  private async processOfflineAction(
    userId: string,
    action: {
      actionType: OfflineActionType;
      data: unknown;
      timestamp: Date;
    }
  ): Promise<void> {
    switch (action.actionType) {
      case OfflineActionType.LOCATION_UPDATE:
        await this.processLocationUpdate(userId, action.data, action.timestamp);
        break;

      case OfflineActionType.SAFE_ZONE_CHECK:
        await this.processSafeZoneCheck(userId, action.data);
        break;

      case OfflineActionType.EMERGENCY_ALERT:
        await this.processEmergencyAlert(userId, action.data);
        break;

      default:
        throw new Error(`Unknown action type: ${action.actionType}`);
    }

    // Store the action for audit trail
    await this.storeOfflineAction(userId, action.actionType, action.data);

    // Mark as synced
    await db.query(
      `UPDATE offline_actions
       SET synced_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND action_type = $2 AND created_at = $3`,
      [userId, action.actionType, action.timestamp]
    );
  }

  /**
   * Process location update from offline action
   */
  private async processLocationUpdate(
    userId: string,
    data: unknown,
    timestamp: Date
  ): Promise<void> {
    const { latitude, longitude, accuracy, context } = data as {
      latitude?: number;
      longitude?: number;
      accuracy?: number;
      context?: Record<string, unknown>;
    };

    // Validate data
    if (!latitude || !longitude || !accuracy) {
      throw new Error('Invalid location data');
    }

    // Store location
    await locationService.storeLocation(
      userId,
      latitude,
      longitude,
      accuracy,
      timestamp,
      context
    );

    logger.debug({ userId }, 'Location update processed from offline action');
  }

  /**
   * Process safe zone check from offline action
   */
  private async processSafeZoneCheck(userId: string, data: unknown): Promise<void> {
    // This would typically check if the location was in a safe zone
    // For now, just log it
    logger.debug({ userId, data }, 'Safe zone check processed from offline action');
  }

  /**
   * Process emergency alert from offline action
   */
  private async processEmergencyAlert(userId: string, data: unknown): Promise<void> {
    // This would typically trigger an emergency alert
    // For now, just log it
    logger.warn({ userId, data }, 'Emergency alert processed from offline action');
  }

  /**
   * Get pending offline actions
   */
  public async getPendingOfflineActions(userId: string): Promise<OfflineAction[]> {
    try {
      const result = await db.query<OfflineAction>(
        `SELECT * FROM offline_actions
         WHERE user_id = $1 AND synced_at IS NULL
         ORDER BY created_at ASC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to get pending offline actions');
      throw error;
    }
  }

  /**
   * Delete old synced offline actions (cleanup)
   */
  public async deleteOldSyncedActions(retentionDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await db.query(
        `DELETE FROM offline_actions
         WHERE synced_at IS NOT NULL AND synced_at < $1`,
        [cutoffDate]
      );

      const deletedCount = result.rowCount ?? 0;

      logger.info(
        {
          deletedCount,
          cutoffDate,
        },
        'Old synced offline actions deleted'
      );

      return deletedCount;
    } catch (error) {
      logger.error({ error }, 'Failed to delete old synced actions');
      throw error;
    }
  }
}

export default new OfflineService();
