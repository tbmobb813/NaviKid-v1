/**
 * NaviKid Safe Zone Service
 *
 * Manages safe zones (geofences) with backend synchronization.
 */

import apiClient, { SafeZone } from './api';
import { offlineQueue } from './offlineQueue';
import wsClient from './websocket';
import { log } from '@/utils/logger';

// ============================================================================
// Safe Zone Service Class
// ============================================================================

class SafeZoneService {
  private static instance: SafeZoneService;
  private safeZones: SafeZone[] = [];
  private listeners: Set<(zones: SafeZone[]) => void> = new Set();
  private alertListeners: Set<(alert: any) => void> = new Set();

  private constructor() {
    log.info('Safe Zone Service initialized');
    this.setupWebSocketListeners();
  }

  static getInstance(): SafeZoneService {
    if (!SafeZoneService.instance) {
      SafeZoneService.instance = new SafeZoneService();
    }
    return SafeZoneService.instance;
  }

  // ==========================================================================
  // Safe Zone CRUD
  // ==========================================================================

  async fetchSafeZones(): Promise<SafeZone[]> {
    try {
      log.debug('Fetching safe zones from backend');

      const response = await apiClient.safeZones.list();

      if (response.success && response.data) {
        this.safeZones = response.data;
        log.info(`Fetched ${this.safeZones.length} safe zones`);
        this.notifyListeners();
        return this.safeZones;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch safe zones');
      }
    } catch (error) {
      log.error('Failed to fetch safe zones', error as Error);
      return this.safeZones;
    }
  }

  async createSafeZone(
    name: string,
    latitude: number,
    longitude: number,
    radius: number,
    type: 'home' | 'school' | 'friend' | 'custom',
  ): Promise<SafeZone | null> {
    try {
      log.info('Creating safe zone', { name, type });

      const response = await apiClient.safeZones.create(name, latitude, longitude, radius, type);

      if (response.success && response.data) {
        this.safeZones.push(response.data);
        log.info('Safe zone created', { id: response.data.id });
        this.notifyListeners();
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to create safe zone');
      }
    } catch (error) {
      log.error('Failed to create safe zone', error as Error);
      return null;
    }
  }

  async updateSafeZone(id: string, updates: Partial<SafeZone>): Promise<SafeZone | null> {
    try {
      log.info('Updating safe zone', { id });

      const response = await apiClient.safeZones.update(id, updates);

      if (response.success && response.data) {
        const index = this.safeZones.findIndex((z) => z.id === id);
        if (index !== -1) {
          this.safeZones[index] = response.data;
        }
        log.info('Safe zone updated', { id });
        this.notifyListeners();
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to update safe zone');
      }
    } catch (error) {
      log.error('Failed to update safe zone', error as Error);
      return null;
    }
  }

  async deleteSafeZone(id: string): Promise<boolean> {
    try {
      log.info('Deleting safe zone', { id });

      const response = await apiClient.safeZones.delete(id);

      if (response.success) {
        this.safeZones = this.safeZones.filter((z) => z.id !== id);
        log.info('Safe zone deleted', { id });
        this.notifyListeners();
        return true;
      } else {
        throw new Error(response.error?.message || 'Failed to delete safe zone');
      }
    } catch (error) {
      log.error('Failed to delete safe zone', error as Error);
      return false;
    }
  }

  // ==========================================================================
  // Geofence Checking
  // ==========================================================================

  async checkGeofence(
    latitude: number,
    longitude: number,
  ): Promise<{ inside: boolean; zone?: SafeZone }> {
    try {
      const response = await apiClient.safeZones.checkGeofence(latitude, longitude);

      if (response.success && response.data) {
        return {
          inside: response.data.insideSafeZone,
          zone: response.data.safeZone,
        };
      } else {
        throw new Error(response.error?.message || 'Failed to check geofence');
      }
    } catch (error) {
      log.error('Failed to check geofence', error as Error);

      // Fallback to local calculation
      return this.checkGeofenceLocal(latitude, longitude);
    }
  }

  private checkGeofenceLocal(
    latitude: number,
    longitude: number,
  ): { inside: boolean; zone?: SafeZone } {
    for (const zone of this.safeZones) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        zone.centerLatitude,
        zone.centerLongitude,
      );

      if (distance <= zone.radius) {
        return { inside: true, zone };
      }
    }

    return { inside: false };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // ==========================================================================
  // WebSocket Alerts
  // ==========================================================================

  private setupWebSocketListeners(): void {
    wsClient.onGeofenceAlert((alert) => {
      log.info('Geofence alert received', { type: alert.type, zone: alert.safeZoneName });
      this.notifyAlertListeners(alert);
    });
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  getSafeZones(): SafeZone[] {
    return [...this.safeZones];
  }

  getSafeZoneById(id: string): SafeZone | undefined {
    return this.safeZones.find((z) => z.id === id);
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================

  addListener(callback: (zones: SafeZone[]) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  addAlertListener(callback: (alert: any) => void): () => void {
    this.alertListeners.add(callback);
    return () => {
      this.alertListeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.safeZones);
      } catch (error) {
        log.error('Error in safe zone listener', error as Error);
      }
    });
  }

  private notifyAlertListeners(alert: any): void {
    this.alertListeners.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        log.error('Error in alert listener', error as Error);
      }
    });
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const safeZoneService = SafeZoneService.getInstance();
export default safeZoneService;
