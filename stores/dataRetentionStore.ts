/**
 * Data Retention Store
 *
 * Tracks when data retention cleanup was last performed
 * Prevents excessive cleanup operations
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runDataRetentionCleanup } from '@/utils/dataRetention';
import { logger } from '@/utils/logger';

export interface RetentionState {
  lastCleanupTime: number | null;
  isCleaningUp: boolean;
  cleanupCount: number;
}

interface RetentionStore extends RetentionState {
  // Actions
  performCleanup: () => Promise<number>;
  setLastCleanupTime: (time: number) => void;
  getTimeSinceLastCleanup: () => number;
  shouldRunCleanup: () => boolean;
}

// Cleanup should run daily
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export const useDataRetentionStore = create<RetentionStore>()(
  persist(
    (set, get) => ({
      lastCleanupTime: null,
      isCleaningUp: false,
      cleanupCount: 0,

      performCleanup: async () => {
        const { isCleaningUp, shouldRunCleanup } = get();

        // Prevent concurrent cleanups
        if (isCleaningUp || !shouldRunCleanup()) {
          return 0;
        }

        set({ isCleaningUp: true });

        try {
          const deletedCount = await runDataRetentionCleanup();

          set((state) => ({
            lastCleanupTime: Date.now(),
            cleanupCount: state.cleanupCount + 1,
            isCleaningUp: false,
          }));

          return deletedCount;
        } catch (error) {
          set({ isCleaningUp: false });
          logger.error('Data retention cleanup error', error as Error);
          return 0;
        }
      },

      setLastCleanupTime: (time: number) => {
        set({ lastCleanupTime: time });
      },

      getTimeSinceLastCleanup: () => {
        const { lastCleanupTime } = get();
        if (!lastCleanupTime) return Infinity;
        return Date.now() - lastCleanupTime;
      },

      shouldRunCleanup: () => {
        const { lastCleanupTime } = get();
        if (!lastCleanupTime) return true; // First time
        return Date.now() - lastCleanupTime > CLEANUP_INTERVAL;
      },
    }),
    {
      name: 'data-retention-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/**
 * Initialize data retention on app startup
 */
export async function initializeDataRetention() {
  const store = useDataRetentionStore.getState();

  if (store.shouldRunCleanup()) {
    const deletedCount = await store.performCleanup();
    logger.info('Data retention initialized with cleanup', { deletedCount });
  } else {
    const timeSince = store.getTimeSinceLastCleanup();
    const hoursLeft = Math.round((CLEANUP_INTERVAL - timeSince) / (60 * 60 * 1000));
    const hoursSince = Math.round(timeSince / (60 * 60 * 1000));
    logger.info('Data retention initialized without cleanup', {
      hoursSinceLastCleanup: hoursSince,
      hoursUntilNextCleanup: hoursLeft,
    });
  }
}
