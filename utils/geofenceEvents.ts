/**
 * Geofence Event Emitter
 * Enables communication between background geofence tasks and React components
 */

export type GeofenceEventType = 'entry' | 'exit';

export type GeofenceEvent = {
  type: GeofenceEventType;
  regionId: string;
  region: {
    identifier: string;
    latitude: number;
    longitude: number;
    radius: number;
  };
  timestamp: number;
};

type GeofenceEventListener = (event: GeofenceEvent) => void;

class GeofenceEventEmitter {
  private listeners: GeofenceEventListener[] = [];

  /**
   * Subscribe to geofence events
   * @returns Unsubscribe function
   */
  subscribe(listener: GeofenceEventListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit a geofence event to all subscribers
   */
  emit(event: GeofenceEvent): void {
    // Use setImmediate to ensure async handling
    setImmediate(() => {
      this.listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          // Prefer structured logging via project logger
          // Cast to unknown first to satisfy various runtime error shapes
          // (e.g., Error, string, or custom error types).
          // Importing logger here is safe because this module runs in the RN runtime.
          const { logger } = require('@/utils/logger') as { logger: any };
          logger.error('Geofence event listener error:', error as unknown as Error);
        }
      });
    });
  }

  /**
   * Get current listener count (useful for debugging)
   */
  getListenerCount(): number {
    return this.listeners.length;
  }

  /**
   * Clear all listeners (useful for cleanup in tests)
   */
  clearListeners(): void {
    this.listeners = [];
  }
}

// Export singleton instance
export const geofenceEvents = new GeofenceEventEmitter();
