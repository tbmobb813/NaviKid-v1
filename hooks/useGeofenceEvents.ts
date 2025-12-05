import { useEffect, useCallback } from 'react';
import { geofenceEvents, GeofenceEvent } from '@/utils/geofenceEvents';

/**
 * React hook to subscribe to geofence events
 *
 * Example usage in ParentDashboard:
 * ```tsx
 * useGeofenceEvents((event) => {
 *   logger.info(`Child ${event.type} safe zone`, { regionId: event.regionId });
 *   // Update dashboard state, show notifications, etc.
 * });
 * ```
 */
export function useGeofenceEvents(callback: (event: GeofenceEvent) => void): void {
  // Wrap callback in useCallback to prevent unnecessary re-subscriptions
  const memoizedCallback = useCallback(callback, [callback]);

  useEffect(() => {
    // Subscribe to events
    const unsubscribe = geofenceEvents.subscribe(memoizedCallback);

    // Cleanup on unmount
    return unsubscribe;
  }, [memoizedCallback]);
}
