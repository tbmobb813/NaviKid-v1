/**
 * Data Retention & Cleanup Utilities
 *
 * Implements COPPA-compliant automatic data cleanup
 * Purges old location data, searches, and offline actions
 */

import { storage, cacheStorage, StorageManager } from './storage';
import { log } from './logger';

const storageManager = new StorageManager(storage);
const cacheManager = new StorageManager(cacheStorage);

/**
 * Data retention policies (in milliseconds)
 */
export const RETENTION_POLICIES = {
  LOCATION_HISTORY: 30 * 24 * 60 * 60 * 1000,
  RECENT_SEARCHES: 90 * 24 * 60 * 60 * 1000,
  OFFLINE_ACTIONS: 14 * 24 * 60 * 60 * 1000,
  CACHE_DATA: 7 * 24 * 60 * 60 * 1000,
};

const STORAGE_KEY_PATTERNS = {
  LOCATION_HISTORY: 'location_history_',
  RECENT_SEARCHES: 'search_',
  OFFLINE_ACTIONS: 'offline_action_',
  CACHE_DATA: 'cache_',
};

/**
 * Helper to parse timestamp from stored data
 */
function getTimestamp(key: string, manager: StorageManager): number | null {
  try {
    const value = manager.getString(key);
    if (!value) return null;
    const parsed = JSON.parse(value) as { timestamp?: number };
    return parsed.timestamp || null;
  } catch (error) {
    log.warn?.(`Failed to parse timestamp from ${key}`, error as Error);
    return null;
  }
}

/**
 * Cleanup location history older than retention period
 */
export function cleanupLocationHistory(): number {
  const cutoffTime = Date.now() - RETENTION_POLICIES.LOCATION_HISTORY;
  let deletedCount = 0;

  storage.getAllKeys().forEach((key) => {
    if (!key.startsWith(STORAGE_KEY_PATTERNS.LOCATION_HISTORY)) return;
    try {
      const timestamp = getTimestamp(key, storageManager);
      if (timestamp && timestamp < cutoffTime) {
        storageManager.delete(key);
        deletedCount++;
      }
    } catch (error) {
      log.warn?.(`Failed to cleanup location history ${key}`, error as Error);
    }
  });

  if (deletedCount > 0) log.info?.(`[DataRetention] Cleaned up ${deletedCount} location records`);
  return deletedCount;
}

/**
 * Cleanup old recent searches
 */
export function cleanupRecentSearches(): number {
  const cutoffTime = Date.now() - RETENTION_POLICIES.RECENT_SEARCHES;
  let deletedCount = 0;

  storage.getAllKeys().forEach((key) => {
    if (!key.startsWith(STORAGE_KEY_PATTERNS.RECENT_SEARCHES)) return;
    try {
      const timestamp = getTimestamp(key, storageManager);
      if (timestamp && timestamp < cutoffTime) {
        storageManager.delete(key);
        deletedCount++;
      }
    } catch (error) {
      log.warn?.(`Failed to cleanup search ${key}`, error as Error);
    }
  });

  if (deletedCount > 0) log.info?.(`[DataRetention] Cleaned up ${deletedCount} search records`);
  return deletedCount;
}

/**
 * Cleanup queued offline actions that are too old
 */
export function cleanupOfflineActions(): number {
  const cutoffTime = Date.now() - RETENTION_POLICIES.OFFLINE_ACTIONS;
  let deletedCount = 0;

  storage.getAllKeys().forEach((key) => {
    if (!key.startsWith(STORAGE_KEY_PATTERNS.OFFLINE_ACTIONS)) return;
    try {
      const timestamp = getTimestamp(key, storageManager);
      if (timestamp && timestamp < cutoffTime) {
        storageManager.delete(key);
        deletedCount++;
      }
    } catch (error) {
      log.warn?.(`Failed to cleanup offline action ${key}`, error as Error);
    }
  });

  if (deletedCount > 0) log.info?.(`[DataRetention] Cleaned up ${deletedCount} offline actions`);
  return deletedCount;
}

/**
 * Cleanup old cache data
 */
export function cleanupCacheData(): number {
  const cutoffTime = Date.now() - RETENTION_POLICIES.CACHE_DATA;
  let deletedCount = 0;

  cacheStorage.getAllKeys().forEach((key) => {
    if (!key.startsWith(STORAGE_KEY_PATTERNS.CACHE_DATA)) return;
    try {
      const timestamp = getTimestamp(key, cacheManager);
      if (timestamp && timestamp < cutoffTime) {
        cacheManager.delete(key);
        deletedCount++;
      }
    } catch (error) {
      log.warn?.(`Failed to cleanup cache ${key}`, error as Error);
    }
  });

  if (deletedCount > 0) log.info?.(`[DataRetention] Cleaned up ${deletedCount} cache records`);
  return deletedCount;
}

/**
 * Run all cleanup operations
 */
export function runDataRetentionCleanup(): number {
  try {
    log.info?.('[DataRetention] Starting cleanup...');
    const startTime = Date.now();

    const results = {
      locationHistory: cleanupLocationHistory(),
      recentSearches: cleanupRecentSearches(),
      offlineActions: cleanupOfflineActions(),
      cacheData: cleanupCacheData(),
    };

    const totalDeleted = Object.values(results).reduce((a, b) => a + b, 0);
    const duration = Date.now() - startTime;

    log.info?.(`[DataRetention] Complete in ${duration}ms - deleted ${totalDeleted} items`);
    return totalDeleted;
  } catch (error) {
    log.error('[DataRetention] Cleanup failed', error as Error);
    return 0;
  }
}

/**
 * Get storage statistics
 */
export function getStorageStats(): { totalKeys: number; estimatedSize: number } {
  try {
    const allKeys = storage.getAllKeys();
    let estimatedSize = 0;

    allKeys.forEach((key) => {
      const value = storageManager.getString(key) || '';
      estimatedSize += (key.length + value.length) * 2;
    });

    return { totalKeys: allKeys.length, estimatedSize };
  } catch (error) {
    log.error('[DataRetention] Failed to get stats', error as Error);
    return { totalKeys: 0, estimatedSize: 0 };
  }
}
