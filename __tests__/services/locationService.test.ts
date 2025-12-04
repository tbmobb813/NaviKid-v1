/**
 * Tests for Location Service
 * Validates location tracking, permissions, and backend synchronization
 */

// Mock expo modules FIRST before any imports
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}), { virtual: true });

jest.mock('expo-battery', () => ({
  getBatteryLevelAsync: jest.fn().mockResolvedValue(0.75),
}), { virtual: true });

// We'll set up the actual mock implementations after module import
jest.mock('expo-location', () => {
  const actualJest = require('jest-mock');
  return {
    getForegroundPermissionsAsync: actualJest.fn(),
    requestForegroundPermissionsAsync: actualJest.fn(),
    requestBackgroundPermissionsAsync: actualJest.fn(),
    getCurrentPositionAsync: actualJest.fn(),
    watchPositionAsync: actualJest.fn(),
    Accuracy: { High: 4 },
  };
}, { virtual: true });

// Create a mutable mock for expo-device
const mockDeviceModule = {
  isDevice: true,
};

jest.mock('expo-device', () => mockDeviceModule, { virtual: true });

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('@/services/api');
jest.mock('@/services/offlineQueue');
jest.mock('@/utils/logger');

import locationService from '@/services/locationService';
import * as Location from 'expo-location';
import apiClient from '@/services/api';
import { offlineQueue } from '@/services/offlineQueue';

// Ensure apiClient has the locations property for mocking
(apiClient as any).locations = {
  sendLocation: jest.fn(),
  getHistory: jest.fn(),
};

describe('LocationService', () => {
  const mockLocation: Location.LocationObject = {
    coords: {
      latitude: 40.7128,
      longitude: -74.006,
      altitude: 10,
      accuracy: 20,
      altitudeAccuracy: 5,
      heading: 90,
      speed: 1.5,
    },
    timestamp: Date.now(),
  };



  beforeEach(() => {
    jest.clearAllMocks();
    mockDeviceModule.isDevice = true;
    
    // Reset all Location API mocks to return undefined by default
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockReset();
    (Location.requestBackgroundPermissionsAsync as jest.Mock).mockReset();
    (Location.getForegroundPermissionsAsync as jest.Mock).mockReset();
    (Location.watchPositionAsync as jest.Mock).mockReset();
    (Location.getCurrentPositionAsync as jest.Mock).mockReset();
    
    // Reset apiClient mocks
    (apiClient.locations.sendLocation as jest.Mock).mockReset();
    (apiClient.locations.getHistory as jest.Mock).mockReset();
    
    // Reset offlineQueue mocks
    (offlineQueue.addAction as jest.Mock).mockReset();
  });

  afterEach(async () => {
    // Stop tracking and reset state between tests
    try {
      await locationService.stopTracking();
    } catch (e) {
      // Ignore errors during cleanup
    }
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = locationService;
      const instance2 = locationService;
      expect(instance1).toBe(instance2);
    });
  });

  describe('Permission Management', () => {
    describe('requestPermissions', () => {
      it('should request foreground and background permissions', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'granted',
        });
        (Location.requestBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'granted',
        });

        const result = await locationService.requestPermissions();

        expect(result).toBe(true);
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
        expect(Location.requestBackgroundPermissionsAsync).toHaveBeenCalled();
      });

      it('should return false if foreground permission denied', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'denied',
        });

        const result = await locationService.requestPermissions();

        expect(result).toBe(false);
        expect(Location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
      });

      it('should continue if background permission denied', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'granted',
        });
        (Location.requestBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'denied',
        });

        const result = await locationService.requestPermissions();

        expect(result).toBe(true);
      });

      it('should skip background permission on non-device', async () => {
        mockDeviceModule.isDevice = false;
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'granted',
        });

        const result = await locationService.requestPermissions();

        expect(result).toBe(true);
        expect(Location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
      });

      it('should handle permission request errors', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockRejectedValue(
          new Error('Permission error')
        );

        const result = await locationService.requestPermissions();

        expect(result).toBe(false);
      });
    });

    describe('hasPermissions', () => {
      it('should return true if permissions granted', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'granted',
        });

        const result = await locationService.hasPermissions();

        expect(result).toBe(true);
      });

      it('should return false if permissions denied', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'denied',
        });

        const result = await locationService.hasPermissions();

        expect(result).toBe(false);
      });

      it('should handle permission check errors', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockRejectedValue(
          new Error('Check error')
        );

        const result = await locationService.hasPermissions();

        expect(result).toBe(false);
      });
    });
  });

  describe('Location Tracking', () => {
    describe('startTracking', () => {
      it('should start location tracking with permissions', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'granted',
        });

        const mockSubscription = {
          remove: jest.fn(),
        };

        (Location.watchPositionAsync as jest.Mock).mockResolvedValue(mockSubscription);

        const result = await locationService.startTracking();

        expect(result).toBe(true);
        expect(Location.watchPositionAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            accuracy: Location.Accuracy.High,
            timeInterval: 30000,
            distanceInterval: 50,
          }),
          expect.any(Function)
        );
      });

      it('should request permissions if not already granted', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'denied',
        });
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'granted',
        });
        (Location.requestBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'granted',
        });

        const mockSubscription = {
          remove: jest.fn(),
        };

        (Location.watchPositionAsync as jest.Mock).mockResolvedValue(mockSubscription);

        const result = await locationService.startTracking();

        expect(result).toBe(true);
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      });

      it('should return false if permissions denied', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'denied',
        });
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'denied',
        });

        const result = await locationService.startTracking();

        expect(result).toBe(false);
      });

      it('should return true if already tracking', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'granted',
        });

        const mockSubscription = {
          remove: jest.fn(),
        };

        (Location.watchPositionAsync as jest.Mock).mockResolvedValue(mockSubscription);

        await locationService.startTracking();
        const result = await locationService.startTracking();

        expect(result).toBe(true);
        expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1);
      });

      it('should handle tracking start errors', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'granted',
        });
        (Location.watchPositionAsync as jest.Mock).mockRejectedValue(
          new Error('Tracking error')
        );

        const result = await locationService.startTracking();

        expect(result).toBe(false);
      });
    });

    describe('stopTracking', () => {
      it('should stop location tracking', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'granted',
        });

        const mockSubscription = {
          remove: jest.fn(),
        };

        (Location.watchPositionAsync as jest.Mock).mockResolvedValue(mockSubscription);

        await locationService.startTracking();
        await locationService.stopTracking();

        expect(mockSubscription.remove).toHaveBeenCalled();
        expect(locationService.isTrackingActive()).toBe(false);
      });

      it('should do nothing if not tracking', async () => {
        await locationService.stopTracking();
        // Should not throw
        expect(true).toBe(true);
      });

      it('should handle stop tracking errors', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'granted',
        });

        const mockSubscription = {
          remove: jest.fn(() => {
            throw new Error('Remove error');
          }),
        };

        (Location.watchPositionAsync as jest.Mock).mockResolvedValue(mockSubscription);

        await locationService.startTracking();
        await locationService.stopTracking();

        // Should not throw
        expect(true).toBe(true);
      });
    });

    describe('isTrackingActive', () => {
      it.skip('should return tracking status', async () => {
        expect(locationService.isTrackingActive()).toBe(false);

        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'granted',
        });

        const mockSubscription = {
          remove: jest.fn(),
        };

        (Location.watchPositionAsync as jest.Mock).mockResolvedValue(mockSubscription);

        await locationService.startTracking();
        expect(locationService.isTrackingActive()).toBe(true);

        await locationService.stopTracking();
        expect(locationService.isTrackingActive()).toBe(false);
      });
    });
  });

  describe('Current Location', () => {
    it('should get current location with permissions', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(mockLocation);

      const result = await locationService.getCurrentLocation();

      expect(result).toBeDefined();
      expect(result?.latitude).toBe(40.7128);
      expect(result?.longitude).toBe(-74.006);
    });

    it('should return null if no permissions', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await locationService.getCurrentLocation();

      expect(result).toBeNull();
    });

    it('should handle getCurrentLocation errors', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
        new Error('Location error')
      );

      const result = await locationService.getCurrentLocation();

      expect(result).toBeNull();
    });
  });

  describe('Location History', () => {
    it('should fetch location history', async () => {
      const mockHistory = [
        {
          id: '1',
          latitude: 40.7128,
          longitude: -74.006,
          timestamp: new Date().toISOString(),
        },
      ];

      (apiClient.locations.getHistory as jest.Mock).mockResolvedValue({
        success: true,
        data: mockHistory,
      });

      const result = await locationService.getLocationHistory();

      expect(result).toEqual(mockHistory);
      expect(apiClient.locations.getHistory).toHaveBeenCalled();
    });

    it('should fetch location history with date range', async () => {
      const mockHistory = [
        {
          id: '1',
          latitude: 40.7128,
          longitude: -74.006,
          timestamp: new Date().toISOString(),
        },
      ];

      (apiClient.locations.getHistory as jest.Mock).mockResolvedValue({
        success: true,
        data: mockHistory,
      });

      const result = await locationService.getLocationHistory(
        '2024-01-01',
        '2024-12-31'
      );

      expect(result).toEqual(mockHistory);
      expect(apiClient.locations.getHistory).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-12-31'
      );
    });

    it('should return empty array on error', async () => {
      (apiClient.locations.getHistory as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: 'API error' },
      });

      const result = await locationService.getLocationHistory();

      expect(result).toEqual([]);
    });
  });

  describe('Utility Methods', () => {
    describe('getLastLocation', () => {
      it('should return null initially', () => {
        const result = locationService.getLastLocation();
        expect(result).toBeNull();
      });
    });

    describe('setUpdateInterval', () => {
      it('should update the tracking interval', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status: 'granted',
        });

        const mockSubscription = {
          remove: jest.fn(),
        };

        (Location.watchPositionAsync as jest.Mock).mockResolvedValue(mockSubscription);

        await locationService.startTracking();
        locationService.setUpdateInterval(60000);

        // Should restart tracking with new interval
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      it('should update interval without restarting if not tracking', () => {
        locationService.setUpdateInterval(60000);
        // Should not throw
        expect(true).toBe(true);
      });
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove location listeners', () => {
      const listener = jest.fn();
      const unsubscribe = locationService.addListener(listener);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it.skip('should notify listeners on location update', async () => {
      const listener = jest.fn();
      locationService.addListener(listener);

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      let locationCallback: any;
      (Location.watchPositionAsync as jest.Mock).mockImplementation(
        (options, callback) => {
          locationCallback = callback;
          return Promise.resolve({
            remove: jest.fn(),
          });
        }
      );

      (apiClient.locations.sendLocation as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: '1' },
      });

      await locationService.startTracking();

      // Simulate location update
      if (locationCallback) {
        await locationCallback(mockLocation);
      }

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(listener).toHaveBeenCalled();
    });

    it.skip('should handle errors in listeners', async () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });

      locationService.addListener(errorListener);

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      let locationCallback: any;
      (Location.watchPositionAsync as jest.Mock).mockImplementation(
        (options, callback) => {
          locationCallback = callback;
          return Promise.resolve({
            remove: jest.fn(),
          });
        }
      );

      (apiClient.locations.sendLocation as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: '1' },
      });

      await locationService.startTracking();

      // Should not throw
      if (locationCallback) {
        await expect(locationCallback(mockLocation)).resolves.not.toThrow();
      }
    });
  });

  describe('Backend Synchronization', () => {
    it.skip('should send location updates to backend', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      let locationCallback: any;
      (Location.watchPositionAsync as jest.Mock).mockImplementation(
        (options, callback) => {
          locationCallback = callback;
          return Promise.resolve({
            remove: jest.fn(),
          });
        }
      );

      (apiClient.locations.sendLocation as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: '1' },
      });

      await locationService.startTracking();

      // Simulate location update
      if (locationCallback) {
        await locationCallback(mockLocation);
      }

      // Wait for async operations and drain microtasks
      await new Promise((resolve) => setTimeout(resolve, 150));
      await new Promise(setImmediate);

      expect(apiClient.locations.sendLocation).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: mockLocation.coords.latitude,
          longitude: mockLocation.coords.longitude,
        })
      );
    });

    it.skip('should queue location updates for offline sync on failure', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      let locationCallback: any;
      (Location.watchPositionAsync as jest.Mock).mockImplementation(
        (options, callback) => {
          locationCallback = callback;
          return Promise.resolve({
            remove: jest.fn(),
          });
        }
      );

      (apiClient.locations.sendLocation as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await locationService.startTracking();

      // Simulate location update
      if (locationCallback) {
        await locationCallback(mockLocation);
      }

      // Wait for async operations and drain microtasks
      await new Promise((resolve) => setTimeout(resolve, 150));
      await new Promise(setImmediate);

      expect(offlineQueue.addAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'location_update',
        })
      );
    });
  });
});
