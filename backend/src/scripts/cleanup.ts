import config from '../config';
import logger from '../utils/logger';
import locationService from '../services/location.service';
import offlineService from '../services/offline.service';
import db from '../database';

/**
 * Data retention cleanup job
 * Runs daily to delete old data according to COPPA compliance
 */
async function runCleanup() {
  try {
    logger.info('Starting data retention cleanup job...');

    // Delete old location data
    const deletedLocations = await locationService.deleteOldLocations(
      config.dataRetention.locationRetentionDays
    );
    logger.info(`Deleted ${deletedLocations} old location records`);

    // Delete old synced offline actions (keep for 7 days)
    const deletedActions = await offlineService.deleteOldSyncedActions(7);
    logger.info(`Deleted ${deletedActions} old synced offline actions`);

    // Delete old audit logs (optional, keep for 90 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const auditResult = await db.query(
      'DELETE FROM audit_logs WHERE timestamp < $1',
      [cutoffDate]
    );
    const deletedAuditLogs = auditResult.rowCount ?? 0;
    logger.info(`Deleted ${deletedAuditLogs} old audit logs`);

    logger.info('Data retention cleanup completed successfully');

    // If running as standalone script, exit
    if (require.main === module) {
      await db.close();
      process.exit(0);
    }
  } catch (error) {
    logger.error({ error  }, 'Data retention cleanup failed');

    if (require.main === module) {
      process.exit(1);
    }

    throw error;
  }
}

// If running as standalone script
if (require.main === module) {
  runCleanup();
}

// Export for scheduled job usage
export default runCleanup;
