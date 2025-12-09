/**
 * NaviKid Offline Queue Service
 *
 * Manages offline action queue and syncs with backend when online.
 */

import type { OfflineAction as ApiOfflineAction } from '@/services/api';
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
  private static instance?: OfflineQueueService;
  private static instanceCounter = 0;
  private static moduleLevelInstanceCache?: OfflineQueueService;
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
  private netInfoUnsubscribe?: () => void;
  private initPromise: Promise<void>;
  private initResolve?: () => void;
  private initializing = false;
  private initialized = false;
  // Test overrides (injected by tests via createForTest)
  private _testApiClient?: unknown;
  private _testAsyncStorage?: unknown;
  private _testNetInfoLib?: unknown;

  private constructor() {
    this.instanceId = ++OfflineQueueService.instanceCounter;
    log.info('Offline Queue Service initialized');
    this.initPromise = new Promise((resolve) => {
      this.initResolve = resolve;
    });
    // Do not auto-start initialization here. Tests will control when
    // initialization (listeners/timers) begins by calling `start()` or
    // by calling `getInstance({ autoStart: true })`.
  }

  /**
   * Get or create singleton instance.
   * @param opts.autoStart When true (default) the service will begin initialization
   *                       (register NetInfo listener and start periodic sync).
   */
  static getInstance(opts?: { autoStart?: boolean }): OfflineQueueService {
    if (!OfflineQueueService.instance) {
      OfflineQueueService.instance = new OfflineQueueService();
    }

    const autoStart = opts?.autoStart !== false;
    if (autoStart) {
      // Kick off initialization asynchronously; callers can await
      // `waitForInitialization()` to observe completion.
      // We intentionally don't await here to keep API synchronous.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      OfflineQueueService.instance.start();
    }

    return OfflineQueueService.instance;
  }

  /**
   * Test helper: create a fresh service instance and inject test doubles.
   * Use this in tests to guarantee the service uses the provided mocks
   * instead of performing call-time requires.
   */
  static createForTest(options: {
    apiClient?: unknown;
    AsyncStorage?: unknown;
    NetInfoLib?: unknown;
    autoStart?: boolean;
  }): OfflineQueueService {
    // Ensure any previous instance is cleared
    if (OfflineQueueService.instance?.cleanup) {
      try {
        // best-effort cleanup
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (OfflineQueueService.instance as any).stopPeriodicSync?.();
      } catch (e) {
        // ignore
      }
    }

    const inst = new OfflineQueueService();
    if (options.apiClient !== undefined) inst._testApiClient = options.apiClient;
    if (options.AsyncStorage !== undefined) inst._testAsyncStorage = options.AsyncStorage;
    if (options.NetInfoLib !== undefined) inst._testNetInfoLib = options.NetInfoLib;

    OfflineQueueService.instance = inst;
    OfflineQueueService.moduleLevelInstanceCache = inst;

    const autoStart = options.autoStart !== false;
    if (autoStart) {
      // start asynchronously; callers/tests can await start()/waitForInitialization
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      inst.start();
    }

    return inst;
  }

  /**
   * Start initialization (register listeners and start timers).
   * Tests can create an instance with `autoStart: false` and then call
   * `start()` after arranging timers/mocks to ensure deterministic behavior.
   */
  async start(): Promise<void> {
    // If initialize has already run, `initResolve` will be undefined.
    // Calling `initialize()` again should be safe (it guards internally).
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.initialize();
    await this.waitForInitialization();
  }

  /**
   * Wait for initialization to complete
   * Useful for testing to ensure the service is ready before running tests
   */
  async waitForInitialization(): Promise<void> {
    await this.initPromise;
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

      // Unsubscribe NetInfo listener if present
      try {
        if (typeof instance['netInfoUnsubscribe'] === 'function') {
          instance['netInfoUnsubscribe']();
        }
      } catch (e) {
        // ignore
      }

      // Clear state
      instance['queue'] = [];
      instance['isOnline'] = true;
      instance['isSyncing'] = false;
      instance['lastSyncTime'] = null;
      instance['listeners'] = new Set();
      instance['initResolve'] = undefined;
      instance['initializing'] = false;
      instance['initialized'] = false;
    }

    // Clear the instance reference so next getInstance() creates a new one
    OfflineQueueService.instance = undefined;

    // Also clear the module-level cache
    OfflineQueueService.moduleLevelInstanceCache = undefined;

    // Do not auto-create a new instance here. Tests should explicitly
    // call `getInstance()` after they finish wiring mocks. Auto-creating
    // the instance can cause the service to initialize with stale
    // module references when tests use `jest.resetModules()`.
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  private async initialize(): Promise<void> {
    try {
      // Prevent duplicate initialization runs on the same instance.
      if (this.initialized) {
        return;
      }
      if (this.initializing) {
        return;
      }
      this.initializing = true;
      // Helpful debug output when running under Jest to diagnose
      // test initialization/timing issues. These logs are intentionally
      // lightweight and gated by the presence of the Jest worker env.
      const isJest = typeof process !== 'undefined' && !!process.env.JEST_WORKER_ID;
      if (isJest) {
        // eslint-disable-next-line no-console
          console.debug(`[offlineQueue] initialize() called`);
      }
      // Load queue from storage
      await this.loadQueue();

      if (isJest) {
        // eslint-disable-next-line no-console
          console.debug(`[offlineQueue] loadQueue completed; queueSize=${this.queue.length}`);
      }

      // In test mode (Jest), strictly require that apiClient was injected via
      // createForTest(). This ensures tests use the exact mocked instance.
      // In production, require at call-time (fallback for non-test usage).
      let apiClientForInit: unknown = null;
      if (isJest) {
        if (!this._testApiClient) {
          throw new Error(
            '[offlineQueue] Test mode detected but no apiClient injected. ' +
              'Call OfflineQueueService.createForTest({ apiClient, ... }) in tests.',
          );
        }
        apiClientForInit = this._testApiClient;
        // Record on global for diagnostic purposes
        try {
          (global as unknown as Record<string, unknown>).__offlineQueue_apiClient =
            apiClientForInit;
          (global as unknown as Record<string, unknown>).__offlineQueue_instance = this;
          // eslint-disable-next-line no-console
          console.debug(
            `[offlineQueue] recorded __offlineQueue_apiClient and __offlineQueue_instance on global (init)`,
          );
        } catch (e) {
          // ignore if globals cannot be set
        }
      } else {
        // Production: require at call-time
        const apiModuleForInit = require('@/services/api');
        apiClientForInit =
          apiModuleForInit && apiModuleForInit.default
            ? apiModuleForInit.default
            : apiModuleForInit;
      }

      // Setup network listener and keep unsubscribe so we can remove it
      // during reset/cleanup to avoid leaking listeners between tests.
      // In test mode, strictly require injected NetInfo. In production, require at call-time.
      let NetInfoLib: unknown = null;
      if (isJest) {
        if (!this._testNetInfoLib) {
          throw new Error(
            '[offlineQueue] Test mode detected but no NetInfoLib injected. ' +
              'Call OfflineQueueService.createForTest({ NetInfoLib, ... }) in tests.',
          );
        }
        NetInfoLib = this._testNetInfoLib;
        // eslint-disable-next-line no-console
        console.debug(
          `[offlineQueue] NetInfo.addEventListener type=${typeof (NetInfoLib as { addEventListener?: unknown }).addEventListener}`,
        );
      } else {
        // Production: require at call-time
        NetInfoLib = require('@react-native-community/netinfo');
      }
      // Avoid double-registering the NetInfo listener if initialize()
      // is called multiple times on the same instance.
      if (!this.netInfoUnsubscribe) {
        type NetInfoState = { isConnected?: boolean };
        const netInfo = NetInfoLib as {
          addEventListener: (listener: (state: NetInfoState) => void) => () => void;
        };
        this.netInfoUnsubscribe = netInfo.addEventListener((state: NetInfoState) => {
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
      }

      // Start periodic sync
      this.startPeriodicSync();

      if (isJest) {
        // eslint-disable-next-line no-console
        console.debug(`[offlineQueue] startPeriodicSync called; timer=${Boolean(this.syncTimer)}`);
      }

      log.info('Offline Queue Service ready', { queueSize: this.queue.length });
      // Mark initialized and signal that initialization is complete
      this.initialized = true;
      this.initializing = false;
      this.initResolve?.();
    } catch (error) {
      log.error('Failed to initialize offline queue', error as Error);
      // Still resolve to prevent hanging even if init fails
      this.initializing = false;
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

      // Jest-gated trace to help tests diagnose storage calls
      const _isJestEnv_add = typeof process !== 'undefined' && !!process.env.JEST_WORKER_ID;
      if (_isJestEnv_add) {
        // eslint-disable-next-line no-console
        console.debug('[offlineQueue] addAction called; queueSize=', this.queue.length);
      }

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

      // Call backend sync endpoint. In test mode, strictly use injected apiClient.
      // In production, require at call-time.
      const _isJestEnv_sync = typeof process !== 'undefined' && !!process.env.JEST_WORKER_ID;
      let apiClientToUse: unknown = null;
      if (_isJestEnv_sync) {
        if (!this._testApiClient) {
          throw new Error(
            '[offlineQueue] Test mode detected in syncQueue but no apiClient injected. ' +
              'Call OfflineQueueService.createForTest({ apiClient, ... }) in tests.',
          );
        }
        apiClientToUse = this._testApiClient;
        // eslint-disable-next-line no-console
        console.debug(
          `[offlineQueue] about to call apiClient.offline.syncActions; type=${typeof (apiClientToUse as { offline?: { syncActions?: unknown } }).offline?.syncActions}`,
        );
        // Expose the runtime apiClient and service instance on global for tests to inspect
        try {
          (global as unknown as Record<string, unknown>).__offlineQueue_apiClient = apiClientToUse;
          (global as unknown as Record<string, unknown>).__offlineQueue_instance = this;
          // eslint-disable-next-line no-console
          console.debug(
            `[offlineQueue] recorded __offlineQueue_apiClient and __offlineQueue_instance on global`,
          );
        } catch (e) {
          // ignore if globals cannot be set
        }
      } else {
        // Production: require at call-time
        const apiModule = require('@/services/api');
        apiClientToUse = apiModule && apiModule.default ? apiModule.default : apiModule;
      }
      const apiClient = apiClientToUse as {
        offline: {
          syncActions: (actions: ApiOfflineAction[]) => Promise<{
            success: boolean;
            data?: { syncedCount: number };
            error?: { message: string };
          }>;
        };
      };
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
      // In test mode, strictly use injected AsyncStorage. In production, require at call-time.
      const _isJestEnv_save = typeof process !== 'undefined' && !!process.env.JEST_WORKER_ID;
      let AsyncStorage: unknown = null;
      if (_isJestEnv_save) {
        if (!this._testAsyncStorage) {
          throw new Error(
            '[offlineQueue] Test mode detected in saveQueue but no AsyncStorage injected. ' +
              'Call OfflineQueueService.createForTest({ AsyncStorage, ... }) in tests.',
          );
        }
        AsyncStorage = this._testAsyncStorage;
        // eslint-disable-next-line no-console
        console.debug(
          `[offlineQueue] saveQueue called; AsyncStorage.setItem=${typeof (AsyncStorage as { setItem?: unknown }).setItem}`,
        );
      } else {
        // Production: require at call-time
        AsyncStorage = require('@react-native-async-storage/async-storage');
      }
      const storage = AsyncStorage as { setItem: (key: string, value: string) => Promise<void> };
      await storage.setItem('offline_queue', JSON.stringify(this.queue));
    } catch (error) {
      log.error('Failed to save queue to storage', error as Error);
    }
  }

  private async loadQueue(): Promise<void> {
    try {
      // In test mode, strictly use injected AsyncStorage. In production, require at call-time.
      const _isJestEnv_load = typeof process !== 'undefined' && !!process.env.JEST_WORKER_ID;
      let AsyncStorage: unknown = null;
      if (_isJestEnv_load) {
        if (!this._testAsyncStorage) {
          throw new Error(
            '[offlineQueue] Test mode detected in loadQueue but no AsyncStorage injected. ' +
              'Call OfflineQueueService.createForTest({ AsyncStorage, ... }) in tests.',
          );
        }
        AsyncStorage = this._testAsyncStorage;
      } else {
        // Production: require at call-time
        AsyncStorage = require('@react-native-async-storage/async-storage');
      }
      const storage = AsyncStorage as { getItem: (key: string) => Promise<string | null> };
      const stored = await storage.getItem('offline_queue');
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

// Provide a getter that returns the singleton instance without auto-start.
// This defers creation until callers (or tests) explicitly request it,
// allowing tests to set up `jest.mock` and `jest.spyOn` before the
// service is instantiated.
export function getOfflineQueue(): OfflineQueueService {
  return OfflineQueueService.getInstance({ autoStart: false });
}

export default getOfflineQueue;

// Backwards-compatible named export `offlineQueue` that proxies to the
// lazy getter. Accessing `offlineQueue` will instantiate (or return)
// the singleton via `getOfflineQueue()` at first access. This preserves
// tests and existing code that do `const m = require('@/services/offlineQueue'); const q = m.offlineQueue;`.
// @ts-ignore - we intentionally manipulate `exports` for compatibility in CommonJS runtime
Object.defineProperty(exports, 'offlineQueue', { enumerable: true, get: getOfflineQueue });

// ---------------------------------------------------------------------------
// Test-only accessor (temporary)
// ---------------------------------------------------------------------------
// Expose a tiny helper for tests to directly obtain the runtime api client
// and the exported instance. This helps tests assert module identity when
// Jest's module reset / virtual mocks interact with call-time requires.
// Remove this once tests are stable.
/* istanbul ignore next */
export function __getInternalsForTest() {
  const apiModule = require('@/services/api');
  const apiClient = apiModule && apiModule.default ? apiModule.default : apiModule;
  // Use getter so tests can obtain the runtime instance after wiring mocks
  return { apiClient, instance: getOfflineQueue() } as const;
}
