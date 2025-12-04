/**
 * Tests for Offline Queue Service
 * Validates queue management, sync logic, and network status handling
 */

// Mock modules FIRST before any imports
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}), { virtual: true });

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}), { virtual: true });

jest.mock('@/services/api', () => ({
  offline: {
    syncActions: jest.fn(),
  },
}));

jest.mock('@/utils/logger', () => ({
  log: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/services/api';
import type { OfflineAction, SyncStatus } from '@/services/offlineQueue';

describe('OfflineQueueService', () => {
  let offlineQueue: any;
  let networkListener: (state: any) => void;

  const mockAction: Omit<OfflineAction, 'id' | 'createdAt'> = {
    actionType: 'location_update',
    data: { latitude: 40.7128, longitude: -74.006 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ doNotFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'] });

    // Capture network listener
    (NetInfo.addEventListener as jest.Mock).mockImplementation((listener) => {
      networkListener = listener;
      return jest.fn(); // unsubscribe function
    });

    // Mock AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Mock API client
    (apiClient.offline.syncActions as jest.Mock).mockResolvedValue({
      success: true,
      data: { syncedCount: 1 },
    });

    // Reset singleton instance
    jest.resetModules();
    const offlineQueueModule = require('@/services/offlineQueue');

    // Clear any existing instance
    if (offlineQueueModule.OfflineQueueService) {
      // @ts-ignore - accessing private static field for testing
      offlineQueueModule.OfflineQueueService.instance = undefined;
    }

    offlineQueue = offlineQueueModule.offlineQueue;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const offlineQueueModule = require('@/services/offlineQueue');
      const instance1 = offlineQueueModule.offlineQueue;
      const instance2 = offlineQueueModule.offlineQueue;
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should load queue from storage on initialization', async () => {
      const storedQueue = [
        {
          id: 'action-1',
          actionType: 'location_update',
          data: { latitude: 40.7128, longitude: -74.006 },
          createdAt: Date.now(),
          retryCount: 0,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedQueue));

      // Reset modules and create new instance
      jest.resetModules();
      const newModule = require('@/services/offlineQueue');
      const newInstance = newModule.OfflineQueueService.getInstance();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('offline_queue');
      expect(newInstance.getQueueSize()).toBe(1);
    });

    it('should handle storage load errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      jest.resetModules();
      const newModule = require('@/services/offlineQueue');
      const newInstance = newModule.OfflineQueueService.getInstance();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(newInstance.getQueueSize()).toBe(0);
    });

    it('should setup network listener', () => {
      expect(NetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should start periodic sync on initialization', () => {
      // Periodic sync timer should be set
      expect(jest.getTimerCount()).toBeGreaterThan(0);
    });
  });

  describe('Queue Management', () => {
    describe('addAction', () => {
      it('should add action to queue', async () => {
        await offlineQueue.addAction(mockAction);

        expect(offlineQueue.getQueueSize()).toBe(1);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'offline_queue',
          expect.any(String)
        );
      });

      it('should generate unique IDs for actions', async () => {
        await offlineQueue.addAction(mockAction);
        await offlineQueue.addAction(mockAction);

        const queue = offlineQueue.getQueue();
        expect(queue[0].id).not.toBe(queue[1].id);
      });

      it('should add timestamp to actions', async () => {
        const beforeTime = Date.now();
        await offlineQueue.addAction(mockAction);
        const afterTime = Date.now();

        const queue = offlineQueue.getQueue();
        expect(queue[0].createdAt).toBeGreaterThanOrEqual(beforeTime);
        expect(queue[0].createdAt).toBeLessThanOrEqual(afterTime);
      });

      it('should initialize retry count to 0', async () => {
        await offlineQueue.addAction(mockAction);

        const queue = offlineQueue.getQueue();
        expect(queue[0].retryCount).toBe(0);
      });

      it('should enforce max queue size', async () => {
        // Set max queue size by accessing private field
        offlineQueue['maxQueueSize'] = 5;

        // Add 6 actions
        for (let i = 0; i < 6; i++) {
          await offlineQueue.addAction({ ...mockAction });
        }

        expect(offlineQueue.getQueueSize()).toBe(5);
      });

      it('should trigger sync if online', async () => {
        offlineQueue['isOnline'] = true;
        const syncSpy = jest.spyOn(offlineQueue, 'syncQueue');

        await offlineQueue.addAction(mockAction);

        expect(syncSpy).toHaveBeenCalled();
      });

      it('should not trigger sync if offline', async () => {
        offlineQueue['isOnline'] = false;
        const syncSpy = jest.spyOn(offlineQueue, 'syncQueue');

        await offlineQueue.addAction(mockAction);

        expect(syncSpy).not.toHaveBeenCalled();
      });

      it('should notify listeners after adding action', async () => {
        const listener = jest.fn();
        offlineQueue.addListener(listener);

        await offlineQueue.addAction(mockAction);

        expect(listener).toHaveBeenCalled();
        expect(listener.mock.calls[0][0]).toMatchObject({
          queueSize: 1,
        });
      });
    });

    describe('removeAction', () => {
      it('should remove action by ID', async () => {
        await offlineQueue.addAction(mockAction);
        const queue = offlineQueue.getQueue();
        const actionId = queue[0].id;

        await offlineQueue.removeAction(actionId);

        expect(offlineQueue.getQueueSize()).toBe(0);
      });

      it('should save queue after removal', async () => {
        await offlineQueue.addAction(mockAction);
        const queue = offlineQueue.getQueue();

        (AsyncStorage.setItem as jest.Mock).mockClear();
        await offlineQueue.removeAction(queue[0].id);

        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });

      it('should handle non-existent action ID gracefully', async () => {
        await offlineQueue.addAction(mockAction);
        const sizeBefore = offlineQueue.getQueueSize();

        await offlineQueue.removeAction('non-existent-id');

        expect(offlineQueue.getQueueSize()).toBe(sizeBefore);
      });
    });

    describe('clearQueue', () => {
      it('should remove all actions', async () => {
        await offlineQueue.addAction(mockAction);
        await offlineQueue.addAction(mockAction);
        await offlineQueue.addAction(mockAction);

        await offlineQueue.clearQueue();

        expect(offlineQueue.getQueueSize()).toBe(0);
      });

      it('should save empty queue to storage', async () => {
        await offlineQueue.addAction(mockAction);

        (AsyncStorage.setItem as jest.Mock).mockClear();
        await offlineQueue.clearQueue();

        expect(AsyncStorage.setItem).toHaveBeenCalledWith('offline_queue', '[]');
      });
    });

    describe('getQueue', () => {
      it('should return copy of queue', async () => {
        await offlineQueue.addAction(mockAction);

        const queue1 = offlineQueue.getQueue();
        const queue2 = offlineQueue.getQueue();

        expect(queue1).toEqual(queue2);
        expect(queue1).not.toBe(queue2); // Different instances
      });
    });

    describe('getQueueSize', () => {
      it('should return correct queue size', async () => {
        expect(offlineQueue.getQueueSize()).toBe(0);

        await offlineQueue.addAction(mockAction);
        expect(offlineQueue.getQueueSize()).toBe(1);

        await offlineQueue.addAction(mockAction);
        expect(offlineQueue.getQueueSize()).toBe(2);
      });
    });
  });

  describe('Sync with Backend', () => {
    describe('syncQueue', () => {
      it('should sync actions with backend', async () => {
        await offlineQueue.addAction(mockAction);

        offlineQueue['isOnline'] = true;
        (apiClient.offline.syncActions as jest.Mock).mockResolvedValue({
          success: true,
          data: { syncedCount: 1 },
        });

        await offlineQueue.syncQueue();

        expect(apiClient.offline.syncActions).toHaveBeenCalled();
        expect(offlineQueue.getQueueSize()).toBe(0);
      });

      it('should not sync if offline', async () => {
        await offlineQueue.addAction(mockAction);

        offlineQueue['isOnline'] = false;
        await offlineQueue.syncQueue();

        expect(apiClient.offline.syncActions).not.toHaveBeenCalled();
      });

      it('should not sync if already syncing', async () => {
        await offlineQueue.addAction(mockAction);

        offlineQueue['isOnline'] = true;
        offlineQueue['isSyncing'] = true;

        await offlineQueue.syncQueue();

        expect(apiClient.offline.syncActions).not.toHaveBeenCalled();
      });

      it('should not sync if queue is empty', async () => {
        offlineQueue['isOnline'] = true;

        await offlineQueue.syncQueue();

        expect(apiClient.offline.syncActions).not.toHaveBeenCalled();
      });

      it('should exclude actions that exceeded retry limit', async () => {
        // Add actions with different retry counts
        await offlineQueue.addAction(mockAction);
        await offlineQueue.addAction(mockAction);

        const queue = offlineQueue.getQueue();
        queue[0].retryCount = 2; // Below limit
        queue[1].retryCount = 5; // Exceeded limit (maxRetries = 3)

        offlineQueue['queue'] = queue;
        offlineQueue['isOnline'] = true;

        await offlineQueue.syncQueue();

        const syncCall = (apiClient.offline.syncActions as jest.Mock).mock.calls[0][0];
        expect(syncCall).toHaveLength(1); // Only one action synced
      });

      it('should update lastSyncTime on successful sync', async () => {
        await offlineQueue.addAction(mockAction);

        offlineQueue['isOnline'] = true;
        const beforeTime = Date.now();
        await offlineQueue.syncQueue();
        const afterTime = Date.now();

        const status = offlineQueue.getStatus();
        expect(status.lastSyncTime).toBeGreaterThanOrEqual(beforeTime);
        expect(status.lastSyncTime).toBeLessThanOrEqual(afterTime);
      });

      it('should increment retry count on sync failure', async () => {
        await offlineQueue.addAction(mockAction);

        offlineQueue['isOnline'] = true;
        (apiClient.offline.syncActions as jest.Mock).mockRejectedValue(
          new Error('Sync failed')
        );

        await offlineQueue.syncQueue();

        const queue = offlineQueue.getQueue();
        expect(queue[0].retryCount).toBe(1);
      });

      it('should handle partial sync success', async () => {
        await offlineQueue.addAction(mockAction);
        await offlineQueue.addAction(mockAction);
        await offlineQueue.addAction(mockAction);

        offlineQueue['isOnline'] = true;
        (apiClient.offline.syncActions as jest.Mock).mockResolvedValue({
          success: true,
          data: { syncedCount: 2 }, // Only 2 out of 3 synced
        });

        await offlineQueue.syncQueue();

        expect(offlineQueue.getQueueSize()).toBe(1); // 1 remaining
      });

      it('should notify listeners during and after sync', async () => {
        const listener = jest.fn();
        offlineQueue.addListener(listener);

        await offlineQueue.addAction(mockAction);
        listener.mockClear();

        offlineQueue['isOnline'] = true;
        await offlineQueue.syncQueue();

        // Should be called at least twice: when starting and when finished
        expect(listener.mock.calls.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Network Status Handling', () => {
    it('should trigger sync when connection is restored', async () => {
      await offlineQueue.addAction(mockAction);

      const syncSpy = jest.spyOn(offlineQueue, 'syncQueue');

      // Simulate going offline
      networkListener({ isConnected: false });
      expect(offlineQueue['isOnline']).toBe(false);

      // Simulate coming back online
      networkListener({ isConnected: true });
      expect(offlineQueue['isOnline']).toBe(true);
      expect(syncSpy).toHaveBeenCalled();
    });

    it('should not trigger sync when going offline', async () => {
      await offlineQueue.addAction(mockAction);

      const syncSpy = jest.spyOn(offlineQueue, 'syncQueue');
      syncSpy.mockClear();

      // Simulate going offline
      networkListener({ isConnected: false });

      expect(syncSpy).not.toHaveBeenCalled();
    });

    it('should update isOnline status', () => {
      networkListener({ isConnected: true });
      expect(offlineQueue.isNetworkOnline()).toBe(true);

      networkListener({ isConnected: false });
      expect(offlineQueue.isNetworkOnline()).toBe(false);
    });

    it('should notify listeners on network status change', () => {
      const listener = jest.fn();
      offlineQueue.addListener(listener);

      listener.mockClear();
      networkListener({ isConnected: false });

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Periodic Sync', () => {
    it('should trigger sync periodically', async () => {
      await offlineQueue.addAction(mockAction);

      offlineQueue['isOnline'] = true;
      const syncSpy = jest.spyOn(offlineQueue, 'syncQueue');
      syncSpy.mockClear();

      // Fast-forward time by sync interval (default 60000ms)
      jest.advanceTimersByTime(60000);

      expect(syncSpy).toHaveBeenCalled();
    });

    it('should not trigger periodic sync if offline', async () => {
      await offlineQueue.addAction(mockAction);

      offlineQueue['isOnline'] = false;
      const syncSpy = jest.spyOn(offlineQueue, 'syncQueue');
      syncSpy.mockClear();

      jest.advanceTimersByTime(60000);

      expect(syncSpy).not.toHaveBeenCalled();
    });

    it('should not trigger periodic sync if queue is empty', () => {
      offlineQueue['isOnline'] = true;
      const syncSpy = jest.spyOn(offlineQueue, 'syncQueue');

      jest.advanceTimersByTime(60000);

      expect(syncSpy).not.toHaveBeenCalled();
    });

    it('should allow changing sync interval', async () => {
      await offlineQueue.addAction(mockAction);

      offlineQueue['isOnline'] = true;
      offlineQueue.setSyncInterval(30000); // 30 seconds

      const syncSpy = jest.spyOn(offlineQueue, 'syncQueue');
      syncSpy.mockClear();

      // Should not sync at old interval
      jest.advanceTimersByTime(60000);

      // Should have synced twice at new interval (30s + 30s = 60s)
      expect(syncSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Status', () => {
    describe('getStatus', () => {
      it('should return correct sync status', async () => {
        const status1 = offlineQueue.getStatus();
        expect(status1).toMatchObject({
          isSyncing: false,
          lastSyncTime: null,
          queueSize: 0,
          failedCount: 0,
        });

        await offlineQueue.addAction(mockAction);

        const status2 = offlineQueue.getStatus();
        expect(status2.queueSize).toBe(1);
      });

      it('should count failed actions correctly', async () => {
        await offlineQueue.addAction(mockAction);
        await offlineQueue.addAction(mockAction);
        await offlineQueue.addAction(mockAction);

        // Set retry counts
        const queue = offlineQueue.getQueue();
        queue[0].retryCount = 2; // Not failed
        queue[1].retryCount = 3; // Failed (maxRetries = 3)
        queue[2].retryCount = 5; // Failed
        offlineQueue['queue'] = queue;

        const status = offlineQueue.getStatus();
        expect(status.failedCount).toBe(2);
      });
    });

    describe('isNetworkOnline', () => {
      it('should return network online status', () => {
        offlineQueue['isOnline'] = true;
        expect(offlineQueue.isNetworkOnline()).toBe(true);

        offlineQueue['isOnline'] = false;
        expect(offlineQueue.isNetworkOnline()).toBe(false);
      });
    });
  });

  describe('Event Listeners', () => {
    describe('addListener', () => {
      it('should add listener and call it on status changes', async () => {
        const listener = jest.fn();
        offlineQueue.addListener(listener);

        await offlineQueue.addAction(mockAction);

        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            queueSize: 1,
          })
        );
      });

      it('should return unsubscribe function', () => {
        const listener = jest.fn();
        const unsubscribe = offlineQueue.addListener(listener);

        expect(typeof unsubscribe).toBe('function');
      });

      it('should stop calling listener after unsubscribe', async () => {
        const listener = jest.fn();
        const unsubscribe = offlineQueue.addListener(listener);

        await offlineQueue.addAction(mockAction);
        expect(listener).toHaveBeenCalledTimes(1);

        unsubscribe();
        listener.mockClear();

        await offlineQueue.addAction(mockAction);
        expect(listener).not.toHaveBeenCalled();
      });

      it('should handle listener errors gracefully', async () => {
        const goodListener = jest.fn();
        const badListener = jest.fn(() => {
          throw new Error('Listener error');
        });

        offlineQueue.addListener(badListener);
        offlineQueue.addListener(goodListener);

        await offlineQueue.addAction(mockAction);

        // Good listener should still be called despite bad listener error
        expect(goodListener).toHaveBeenCalled();
      });
    });

    describe('notifyListeners', () => {
      it('should call all registered listeners', () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();
        const listener3 = jest.fn();

        offlineQueue.addListener(listener1);
        offlineQueue.addListener(listener2);
        offlineQueue.addListener(listener3);

        offlineQueue['notifyListeners']();

        expect(listener1).toHaveBeenCalled();
        expect(listener2).toHaveBeenCalled();
        expect(listener3).toHaveBeenCalled();
      });
    });
  });

  describe('Storage', () => {
    it('should save queue to AsyncStorage', async () => {
      await offlineQueue.addAction(mockAction);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_queue',
        expect.stringContaining('location_update')
      );
    });

    it('should handle save errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'));

      await expect(offlineQueue.addAction(mockAction)).resolves.not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should stop periodic sync and save queue', async () => {
      await offlineQueue.addAction(mockAction);

      const stopSpy = jest.spyOn(offlineQueue, 'stopPeriodicSync' as any);
      (AsyncStorage.setItem as jest.Mock).mockClear();

      await offlineQueue.cleanup();

      expect(stopSpy).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });
});
