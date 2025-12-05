/**
 * NaviKid Offline Queue Service
 *
 * Manages offline action queue and syncs with backend when online.
 */

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { OfflineAction as ApiOfflineAction } from './api';
import { log } from '@/utils/logger';

// ============================================================================
// Types
// ============================================================================

// Client-side offline action with retry tracking
export interface OfflineAction {
  id: string;
  actionType: 'location_update' | 'safe_zone_check' | 'emergency_alert';
  data: any;
  createdAt: number;
  retryCount?: number;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  queueSize: number;
  failedCount: number;
}

// ============================================================================
// Offline Queue Service Class
// ============================================================================

class OfflineQueueService {
  private static instance: OfflineQueueService;
  private static instanceCounter = 0;
  private static moduleLevelInstanceCache: OfflineQueueService | undefined;
  private instanceId: number;
  private queue: OfflineAction[] = [];
  private isOnline = true;
  private isSyncing = false;
  private lastSyncTime: number | null = null;
  private maxQueueSize = 1000;
  private maxRetries = 3;
  private syncInterval = 60000; // 1 minute
  private syncTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private initPromise: Promise<void>;
  private initResolve?: () => void;

  private constructor() {
    this.instanceId = ++OfflineQueueService.instanceCounter;
    log.info('Offline Queue Service initialized');
    this.initPromise = new Promise((resolve) => {
      this.initResolve = resolve;
    });
    this.initialize();
  }

  static getInstance(): OfflineQueueService {
    if (!OfflineQueueService.instance) {
      OfflineQueueService.instance = new OfflineQueueService();
    }
    return OfflineQueueService.instance;
  }

  /**
   * Reset singleton instance for testing purposes
   * This allows tests to get a fresh instance with clean state
   */
  static resetInstance(): void {
    if (OfflineQueueService.instance) {
      // Clean up existing instance
      const instance = OfflineQueueService.instance;

      // Stop periodic sync
      if (instance['syncTimer']) {
        clearInterval(instance['syncTimer']);
        instance['syncTimer'] = null;
      }

      // Clear state
      instance['queue'] = [];
      instance['isOnline'] = true;
      instance['isSyncing'] = false;
      instance['lastSyncTime'] = null;
      instance['listeners'] = new Set();
    }

    // Clear the instance reference so next getInstance() creates a new one
    OfflineQueueService.instance = undefined as any;
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  private async initialize(): Promise<void> {
    try {
      // Load queue from storage
      await this.loadQueue();

      // Setup network listener
      NetInfo.addEventListener((state) => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected === true;

        log.debug('Network status changed', { isOnline: this.isOnline });

        // If we just came online, trigger sync
        if (!wasOnline && this.isOnline) {
          log.info('Connection restored, triggering sync');
          this.syncQueue();
        }

        this.notifyListeners();
      });

      // Start periodic sync
      this.startPeriodicSync();

      log.info('Offline Queue Service ready', { queueSize: this.queue.length });

      // Signal that initialization is complete
      this.initResolve?.();
    } catch (error) {
      log.error('Failed to initialize offline queue', error as Error);
      // Still resolve to prevent hanging even if init fails
      this.initResolve?.();
    }
  }

  // ==========================================================================
  // Queue Management
  // ==========================================================================

  async addAction(
    action: Omit<OfflineAction, 'id' | 'createdAt'> & { actionType: OfflineAction['actionType'] },
  ): Promise<void> {
    try {
      // Check queue size limit
      if (this.queue.length >= this.maxQueueSize) {
        log.warn('Queue size limit reached, removing oldest action');
        this.queue.shift();
      }

      const queuedAction: OfflineAction = {
        ...action,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        retryCount: 0,
      };

      this.queue.push(queuedAction);

      log.debug('Action added to queue', {
        actionType: queuedAction.actionType,
        queueSize: this.queue.length,
      });

      // Save to storage
      await this.saveQueue();

      // Try to sync immediately if online
      if (this.isOnline && !this.isSyncing) {
        this.syncQueue();
      }

      this.notifyListeners();
    } catch (error) {
      log.error('Failed to add action to queue', error as Error);
    }
  }

  async removeAction(id: string): Promise<void> {
    try {
      const index = this.queue.findIndex((action) => action.id === id);
      if (index !== -1) {
        this.queue.splice(index, 1);
        await this.saveQueue();
        this.notifyListeners();
      }
    } catch (error) {
      log.error('Failed to remove action from queue', error as Error);
    }
  }

  async clearQueue(): Promise<void> {
    try {
      this.queue = [];
      await this.saveQueue();
      log.info('Queue cleared');
      this.notifyListeners();
    } catch (error) {
      log.error('Failed to clear queue', error as Error);
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getQueue(): OfflineAction[] {
    return [...this.queue];
  }

  // ==========================================================================
  // Sync with Backend
  // ==========================================================================

  async syncQueue(): Promise<void> {
    if (!this.isOnline) {
      log.debug('Cannot sync: offline');
      return;
    }

    if (this.isSyncing) {
      log.debug('Sync already in progress');
      return;
    }

    if (this.queue.length === 0) {
      log.debug('Queue is empty, nothing to sync');
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      log.info(`Starting queue sync (${this.queue.length} actions)`);

      // Get actions to sync (exclude those that have failed too many times)
      const actionsToSync = this.queue.filter(
        (action) => (action.retryCount || 0) < this.maxRetries,
      );

      if (actionsToSync.length === 0) {
        log.warn('All queued actions have exceeded retry limit');
        this.isSyncing = false;
        this.notifyListeners();
        return;
      }

      // Transform client actions to API format
      const apiActions: ApiOfflineAction[] = actionsToSync.map((action) => ({
        id: action.id,
        actionType: action.actionType,
        data: action.data,
        createdAt: action.createdAt,
      }));

      // Call backend sync endpoint
      const response = await apiClient.offline.syncActions(apiActions);

      if (response.success && response.data) {
        const syncedCount = response.data.syncedCount;
        log.info(`Successfully synced ${syncedCount} actions`);

        // Remove synced actions from queue
        const syncedIds = actionsToSync.slice(0, syncedCount).map((a) => a.id);
        this.queue = this.queue.filter((action) => !syncedIds.includes(action.id));

        this.lastSyncTime = Date.now();
        await this.saveQueue();
      } else {
        throw new Error(response.error?.message || 'Sync failed');
      }
    } catch (error) {
      log.error('Queue sync failed', error as Error);

      // Increment retry count for all actions
      this.queue.forEach((action) => {
        action.retryCount = (action.retryCount || 0) + 1;
      });

      await this.saveQueue();
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  // ==========================================================================
  // Periodic Sync
  // ==========================================================================

  private startPeriodicSync(): void {
    this.stopPeriodicSync();

    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.queue.length > 0) {
        log.debug('Periodic sync triggered');
        this.syncQueue();
      }
    }, this.syncInterval);
  }

  private stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  setSyncInterval(milliseconds: number): void {
    this.syncInterval = milliseconds;
    this.startPeriodicSync();
  }

  // ==========================================================================
  // Storage
  // ==========================================================================

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue));
    } catch (error) {
      log.error('Failed to save queue to storage', error as Error);
    }
  }

  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('offline_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
        log.debug(`Loaded ${this.queue.length} actions from storage`);
      }
    } catch (error) {
      log.error('Failed to load queue from storage', error as Error);
      this.queue = [];
    }
  }

  // ==========================================================================
  // Status
  // ==========================================================================

  getStatus(): SyncStatus {
    const failedCount = this.queue.filter(
      (action) => (action.retryCount || 0) >= this.maxRetries,
    ).length;

    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      queueSize: this.queue.length,
      failedCount,
    };
  }

  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================

  addListener(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        log.error('Error in offline queue listener', error as Error);
      }
    });
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  async cleanup(): Promise<void> {
    this.stopPeriodicSync();
    await this.saveQueue();
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export { OfflineQueueService };
export const offlineQueue = OfflineQueueService.getInstance();
export default offlineQueue;
