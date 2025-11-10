// setup once at app start
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import Config from '@/utils/config';
import { showNotification } from '@/utils/notifications';

export const GEOFENCE_TASK = 'kidmap-geofence-task';

type GeofenceEventData = {
  eventType: Location.LocationGeofencingEventType;
  region: {
    identifier: string;
    latitude: number;
    longitude: number;
    radius: number;
  };
};

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Geofence task error:', error);
    return;
  }

  const { eventType, region } = (data ?? {}) as GeofenceEventData;

  if (!eventType || !region) {
    console.warn('Geofence task: missing event data');
    return;
  }

  await handleGeofenceEvent(eventType, region);
});

async function handleGeofenceEvent(
  eventType: Location.LocationGeofencingEventType,
  region: { identifier: string; latitude: number; longitude: number; radius: number },
) {
  const isEntry = eventType === Location.LocationGeofencingEventType.Enter;
  const isExit = eventType === Location.LocationGeofencingEventType.Exit;

  if (!isEntry && !isExit) {
    return;
  }

  const title = isEntry ? '🟢 Safe Zone Entry' : '🔴 Safe Zone Exit';
  const body = isEntry
    ? `Child has entered safe zone: ${region.identifier}`
    : `Child has left safe zone: ${region.identifier}`;

  try {
    // Send local notification
    await showNotification({
      title,
      body,
      priority: 'high',
    });

    // Log event for debugging
    console.log(`Geofence ${isEntry ? 'entry' : 'exit'}: ${region.identifier}`, {
      type: 'geofence',
      eventType: isEntry ? 'entry' : 'exit',
      regionId: region.identifier,
      timestamp: Date.now(),
    });

    // Log to analytics/monitoring system
    const { analytics } = await import('@/utils/analytics');
    analytics.track('geofence_event', {
      event_type: isEntry ? 'entry' : 'exit',
      region_id: region.identifier,
      latitude: region.latitude,
      longitude: region.longitude,
      radius: region.radius,
      timestamp: Date.now(),
    });

    // Update parental dashboard with real-time activity
    try {
      const { useParentalStore } = await import('@/stores/parentalStore');
      const parentalStore = useParentalStore.getState();

      // Add to safe zone activity log
      if (parentalStore.addSafeZoneActivity) {
        parentalStore.addSafeZoneActivity({
          id: `activity-${Date.now()}`,
          zoneId: region.identifier,
          zoneName: region.identifier,
          eventType: isEntry ? 'entry' : 'exit',
          timestamp: Date.now(),
          location: {
            latitude: region.latitude,
            longitude: region.longitude,
          },
        });
      }

      // Send push notification to guardian's device
      // This would typically use a backend service to send to the parent's device
      // For now, we'll use local notifications as a placeholder
      if (parentalStore.settings?.safeZoneAlerts) {
        // In a real implementation, you would send this to a backend service
        // that forwards the notification to the guardian's registered device(s)
        console.log('Guardian notification queued:', {
          type: 'geofence_alert',
          title,
          body,
          regionId: region.identifier,
          guardianDevices: 'backend-service-would-handle-this',
        });
      }
    } catch (dashboardError) {
      console.error('Failed to update parental dashboard:', dashboardError);
    }
  } catch (notificationError) {
    console.error('Failed to send geofence notification:', notificationError);
  }
}

export async function startGeofencing(
  regions: Array<{ latitude: number; longitude: number; radius: number; identifier: string }>,
) {
  if (!Config.FEATURES.GEOFENCING || regions.length === 0) {
    return;
  }

  await Location.requestForegroundPermissionsAsync();
  await Location.requestBackgroundPermissionsAsync();
  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
}
