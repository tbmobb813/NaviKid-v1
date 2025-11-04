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
          const deletedCount = runDataRetentionCleanup();

          set((state) => ({
            lastCleanupTime: Date.now(),
            cleanupCount: state.cleanupCount + 1,
            isCleaningUp: false,
          }));

          return deletedCount;
        } catch (error) {
          set({ isCleaningUp: false });
          console.error('[DataRetention] Cleanup error:', error);
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
    }
  )
);

/**
 * Initialize data retention on app startup
 */
export async function initializeDataRetention() {
  const store = useDataRetentionStore.getState();

  if (store.shouldRunCleanup()) {
    const deletedCount = await store.performCleanup();
    console.log(`[DataRetention] Initialized with ${deletedCount} items deleted`);
  } else {
    const timeSince = store.getTimeSinceLastCleanup();
    const hoursLeft = Math.round((CLEANUP_INTERVAL - timeSince) / (60 * 60 * 1000));
    console.log(
      `[DataRetention] Last cleanup ${Math.round(timeSince / (60 * 60 * 1000))}h ago, next cleanup in ~${hoursLeft}h`
    );
  }
}
