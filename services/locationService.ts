/**
 * NaviKid Location Service
 *
 * Handles location tracking, backend sync, and offline queue management.
 */

import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import apiClient from './api';
import { offlineQueue } from './offlineQueue';
import { log } from '@/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  context?: {
    batteryLevel?: number;
    isMoving?: boolean;
    speed?: number;
    altitude?: number;
    heading?: number;
  };
}

// ============================================================================
// Location Service Class
// ============================================================================

class LocationService {
  private static instance: LocationService;
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking = false;
  private lastLocationUpdate: LocationUpdate | null = null;
  private updateInterval = 30000; // 30 seconds
  private listeners: Set<(location: LocationUpdate) => void> = new Set();

  private constructor() {
    log.info('Location Service initialized');
  }

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // ==========================================================================
  // Permission Management
  // ==========================================================================

  async requestPermissions(): Promise<boolean> {
    try {
      log.info('Requesting location permissions');

      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        log.warn('Foreground location permission denied');
        return false;
      }

      // Request background permission if on native device
      if (Device.isDevice) {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          log.warn('Background location permission denied');
          // Continue anyway - foreground is enough for basic functionality
        }
      }

      log.info('Location permissions granted');
      return true;
    } catch (error) {
      log.error('Failed to request location permissions', error as Error);
      return false;
    }
  }

  async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      log.error('Failed to check location permissions', error as Error);
      return false;
    }
  }

  // ==========================================================================
  // Location Tracking
  // ==========================================================================

  async startTracking(): Promise<boolean> {
    if (this.isTracking) {
      log.debug('Location tracking already active');
      return true;
    }

    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        log.warn('No location permission, requesting...');
        const granted = await this.requestPermissions();
        if (!granted) {
          return false;
        }
      }

      log.info('Starting location tracking');

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: this.updateInterval,
          distanceInterval: 50, // 50 meters
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      this.isTracking = true;
      log.info('Location tracking started');
      return true;
    } catch (error) {
      log.error('Failed to start location tracking', error as Error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    if (!this.isTracking) {
      return;
    }

    try {
      log.info('Stopping location tracking');

      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      this.isTracking = false;
      log.info('Location tracking stopped');
    } catch (error) {
      log.error('Failed to stop location tracking', error as Error);
    }
  }

  private async handleLocationUpdate(location: Location.LocationObject): Promise<void> {
    try {
      // Get additional context
      const batteryLevel = await this.getBatteryLevel();
      const isMoving = location.coords.speed ? location.coords.speed > 0.5 : false; // 0.5 m/s threshold

      const locationUpdate: LocationUpdate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
        context: {
          batteryLevel,
          isMoving,
          speed: location.coords.speed || undefined,
          altitude: location.coords.altitude || undefined,
          heading: location.coords.heading || undefined,
        },
      };

      this.lastLocationUpdate = locationUpdate;

      // Notify listeners
      this.notifyListeners(locationUpdate);

      // Send to backend
      await this.sendLocationToBackend(locationUpdate);
    } catch (error) {
      log.error('Failed to handle location update', error as Error);
    }
  }

  private async sendLocationToBackend(location: LocationUpdate): Promise<void> {
    try {
      log.debug('Sending location to backend', {
        lat: location.latitude,
        lng: location.longitude,
      });

      const response = await apiClient.locations.sendLocation(
        location.latitude,
        location.longitude,
        location.accuracy,
        location.context
      );

      if (response.success && response.data) {
        log.debug('Location sent successfully', { id: response.data.id });
      } else {
        throw new Error(response.error?.message || 'Failed to send location');
      }
    } catch (error) {
      log.warn('Failed to send location to backend, queueing for offline sync', error as Error);

      // Queue for offline sync
      await offlineQueue.addAction({
        type: 'location_update',
        data: location,
        timestamp: Date.now(),
      });
    }
  }

  // ==========================================================================
  // Current Location (one-time)
  // ==========================================================================

  async getCurrentLocation(): Promise<LocationUpdate | null> {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        log.warn('No location permission for getCurrentLocation');
        return null;
      }

      log.debug('Getting current location');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const batteryLevel = await this.getBatteryLevel();

      const locationUpdate: LocationUpdate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
        context: {
          batteryLevel,
          speed: location.coords.speed || undefined,
          altitude: location.coords.altitude || undefined,
          heading: location.coords.heading || undefined,
        },
      };

      return locationUpdate;
    } catch (error) {
      log.error('Failed to get current location', error as Error);
      return null;
    }
  }

  // ==========================================================================
  // Location History
  // ==========================================================================

  async getLocationHistory(startDate?: string, endDate?: string): Promise<any[]> {
    try {
      log.debug('Fetching location history from backend');

      const response = await apiClient.locations.getHistory(startDate, endDate);

      if (response.success && response.data) {
        log.debug(`Fetched ${response.data.length} location records`);
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch location history');
      }
    } catch (error) {
      log.error('Failed to get location history', error as Error);
      return [];
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private async getBatteryLevel(): Promise<number> {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      return Math.round(batteryLevel * 100);
    } catch (error) {
      log.warn('Failed to get battery level', error as Error);
      return -1;
    }
  }

  getLastLocation(): LocationUpdate | null {
    return this.lastLocationUpdate;
  }

  isTrackingActive(): boolean {
    return this.isTracking;
  }

  setUpdateInterval(milliseconds: number): void {
    this.updateInterval = milliseconds;

    // Restart tracking if active
    if (this.isTracking) {
      this.stopTracking().then(() => {
        this.startTracking();
      });
    }
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================

  addListener(callback: (location: LocationUpdate) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(location: LocationUpdate): void {
    this.listeners.forEach((callback) => {
      try {
        callback(location);
      } catch (error) {
        log.error('Error in location listener', error as Error);
      }
    });
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const locationService = LocationService.getInstance();
export default locationService;
