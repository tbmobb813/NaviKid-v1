/**
 * Comprehensive Tests for Data Retention Store
 */

import { useDataRetentionStore, initializeDataRetention } from '../../stores/dataRetentionStore';

// Mock external dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../utils/dataRetention', () => ({
  runDataRetentionCleanup: jest.fn(() => Promise.resolve(5)), // Mock returns 5 deleted items
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { runDataRetentionCleanup } from '../../utils/dataRetention';
import { logger } from '../../utils/logger';

describe('Data Retention Store', () => {
  // Reset store and mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    useDataRetentionStore.setState({
      lastCleanupTime: null,
      isCleaningUp: false,
      cleanupCount: 0,
    });
  });

  describe('Initial State', () => {
    it('should have correct default values', () => {
      const store = useDataRetentionStore.getState();

      expect(store.lastCleanupTime).toBe(null);
      expect(store.isCleaningUp).toBe(false);
      expect(store.cleanupCount).toBe(0);
    });

    it('should indicate cleanup needed on first run', () => {
      const { shouldRunCleanup } = useDataRetentionStore.getState();

      expect(shouldRunCleanup()).toBe(true);
    });

    it('should return Infinity for time since last cleanup when never run', () => {
      const { getTimeSinceLastCleanup } = useDataRetentionStore.getState();

      expect(getTimeSinceLastCleanup()).toBe(Infinity);
    });
  });

  describe('Cleanup Operations', () => {
    it('should perform cleanup successfully', async () => {
      const { performCleanup } = useDataRetentionStore.getState();

      const deletedCount = await performCleanup();

      expect(deletedCount).toBe(5);
      expect(runDataRetentionCleanup).toHaveBeenCalledTimes(1);
    });

    it('should update lastCleanupTime after successful cleanup', async () => {
      const { performCleanup } = useDataRetentionStore.getState();
      const beforeTime = Date.now();

      await performCleanup();

      const store = useDataRetentionStore.getState();
      expect(store.lastCleanupTime).toBeGreaterThanOrEqual(beforeTime);
      expect(store.lastCleanupTime).toBeLessThanOrEqual(Date.now());
    });

    it('should increment cleanupCount after each cleanup', async () => {
      const { performCleanup } = useDataRetentionStore.getState();

      await performCleanup();
      expect(useDataRetentionStore.getState().cleanupCount).toBe(1);

      // Manually set lastCleanupTime to trigger another cleanup
      useDataRetentionStore.setState({ lastCleanupTime: Date.now() - 25 * 60 * 60 * 1000 });

      await performCleanup();
      expect(useDataRetentionStore.getState().cleanupCount).toBe(2);
    });

    it('should set isCleaningUp flag during cleanup', async () => {
      const { performCleanup } = useDataRetentionStore.getState();

      let isCleaningDuringExecution = false;
      (runDataRetentionCleanup as jest.Mock).mockImplementationOnce(async () => {
        isCleaningDuringExecution = useDataRetentionStore.getState().isCleaningUp;
        return 5;
      });

      await performCleanup();

      expect(isCleaningDuringExecution).toBe(true);
      expect(useDataRetentionStore.getState().isCleaningUp).toBe(false);
    });

    it('should prevent concurrent cleanups', async () => {
      const { performCleanup } = useDataRetentionStore.getState();

      // Mock a slow cleanup
      (runDataRetentionCleanup as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve(5), 100))
      );

      const cleanup1 = performCleanup();
      const cleanup2 = performCleanup(); // Try concurrent cleanup

      const result1 = await cleanup1;
      const result2 = await cleanup2;

      expect(result1).toBe(5);
      expect(result2).toBe(0); // Second one should be prevented
      expect(runDataRetentionCleanup).toHaveBeenCalledTimes(1);
    });

    it('should handle cleanup errors gracefully', async () => {
      const { performCleanup } = useDataRetentionStore.getState();
      const error = new Error('Cleanup failed');

      (runDataRetentionCleanup as jest.Mock).mockRejectedValueOnce(error);

      const result = await performCleanup();

      expect(result).toBe(0);
      expect(logger.error).toHaveBeenCalledWith('Data retention cleanup error', error);
      expect(useDataRetentionStore.getState().isCleaningUp).toBe(false);
    });

    it('should not run cleanup if interval not exceeded', async () => {
      const { performCleanup, setLastCleanupTime } = useDataRetentionStore.getState();

      // Set cleanup time to 1 hour ago (less than 24 hours)
      setLastCleanupTime(Date.now() - 60 * 60 * 1000);

      const result = await performCleanup();

      expect(result).toBe(0);
      expect(runDataRetentionCleanup).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup Timing', () => {
    it('should calculate time since last cleanup', () => {
      const { setLastCleanupTime, getTimeSinceLastCleanup } = useDataRetentionStore.getState();

      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      setLastCleanupTime(twoHoursAgo);

      const timeSince = getTimeSinceLastCleanup();
      expect(timeSince).toBeGreaterThanOrEqual(2 * 60 * 60 * 1000 - 100); // Allow 100ms margin
      expect(timeSince).toBeLessThanOrEqual(2 * 60 * 60 * 1000 + 100);
    });

    it('should indicate cleanup needed after 24 hours', () => {
      const { setLastCleanupTime, shouldRunCleanup } = useDataRetentionStore.getState();

      // Set cleanup time to 25 hours ago (exceeds 24 hour interval)
      setLastCleanupTime(Date.now() - 25 * 60 * 60 * 1000);

      expect(shouldRunCleanup()).toBe(true);
    });

    it('should indicate cleanup not needed within 24 hours', () => {
      const { setLastCleanupTime, shouldRunCleanup } = useDataRetentionStore.getState();

      // Set cleanup time to 12 hours ago (within 24 hour interval)
      setLastCleanupTime(Date.now() - 12 * 60 * 60 * 1000);

      expect(shouldRunCleanup()).toBe(false);
    });

    it('should handle edge case at exactly 24 hours', () => {
      const { setLastCleanupTime, shouldRunCleanup } = useDataRetentionStore.getState();

      // Use a fixed baseline time to avoid timing issues
      const baseTime = 1000000000000; // Fixed baseline
      const now = baseTime + 24 * 60 * 60 * 1000; // Exactly 24 hours later

      // Mock Date.now() during the test
      const realNow = Date.now;
      Date.now = jest.fn(() => now);

      setLastCleanupTime(baseTime);

      // At exactly 24 hours, should not run (needs to be > 24 hours)
      expect(shouldRunCleanup()).toBe(false);

      // Restore Date.now
      Date.now = realNow;
    });
  });

  describe('Manual Cleanup Time Setting', () => {
    it('should manually set last cleanup time', () => {
      const { setLastCleanupTime } = useDataRetentionStore.getState();

      const testTime = 1234567890000;
      setLastCleanupTime(testTime);

      const store = useDataRetentionStore.getState();
      expect(store.lastCleanupTime).toBe(testTime);
    });

    it('should affect shouldRunCleanup calculation', () => {
      const { setLastCleanupTime, shouldRunCleanup } = useDataRetentionStore.getState();

      setLastCleanupTime(Date.now() - 1000); // 1 second ago
      expect(shouldRunCleanup()).toBe(false);

      setLastCleanupTime(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      expect(shouldRunCleanup()).toBe(true);
    });
  });

  describe('Initialization', () => {
    it('should run cleanup on first initialization', async () => {
      await initializeDataRetention();

      expect(runDataRetentionCleanup).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Data retention initialized with cleanup', {
        deletedCount: 5,
      });
    });

    it('should skip cleanup if recently run', async () => {
      const { setLastCleanupTime } = useDataRetentionStore.getState();

      // Set cleanup to 1 hour ago
      setLastCleanupTime(Date.now() - 60 * 60 * 1000);

      await initializeDataRetention();

      expect(runDataRetentionCleanup).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Data retention initialized without cleanup',
        expect.objectContaining({
          hoursSinceLastCleanup: expect.any(Number),
          hoursUntilNextCleanup: expect.any(Number),
        })
      );
    });

    it('should run cleanup if interval exceeded', async () => {
      const { setLastCleanupTime } = useDataRetentionStore.getState();

      // Set cleanup to 25 hours ago
      setLastCleanupTime(Date.now() - 25 * 60 * 60 * 1000);

      await initializeDataRetention();

      expect(runDataRetentionCleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe('Persistence', () => {
    it('should be configured with AsyncStorage', () => {
      expect(useDataRetentionStore).toBeDefined();
      expect(useDataRetentionStore.getState).toBeDefined();
    });

    it('should maintain cleanup count across operations', async () => {
      const { performCleanup, setLastCleanupTime } = useDataRetentionStore.getState();

      await performCleanup();
      expect(useDataRetentionStore.getState().cleanupCount).toBe(1);

      // Force another cleanup by setting old time
      setLastCleanupTime(Date.now() - 25 * 60 * 60 * 1000);

      await performCleanup();
      expect(useDataRetentionStore.getState().cleanupCount).toBe(2);
    });
  });
});
