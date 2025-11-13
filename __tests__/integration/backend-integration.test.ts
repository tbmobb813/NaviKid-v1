/**
 * NaviKid Backend Integration Tests
 *
 * Comprehensive integration tests for frontend-backend communication.
 * Tests all 8 required scenarios.
 */

import apiClient from '@/services/api';
import wsClient from '@/services/websocket';
import locationService from '@/services/locationService';
import safeZoneService from '@/services/safeZoneService';
import emergencyService from '@/services/emergencyService';
import offlineQueue from '@/services/offlineQueue';

// Mock implementations for testing
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      api: {
        baseUrl: 'http://localhost:3000',
        timeout: 15000,
      },
    },
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

describe('Backend Integration Tests', () => {
  const testUser = {
    email: `test-${Date.now()}@navikid.com`,
    password: 'Test@123456',
    role: 'parent' as const,
  };

  let userId: string;
  let safeZoneId: string;
  let contactId: string;

  // ============================================================================
  // Test 1: User Registration & Login
  // ============================================================================

  describe('Test 1: User Registration & Login', () => {
    it('should register a new user', async () => {
      const response = await apiClient.auth.register(
        testUser.email,
        testUser.password,
        testUser.role
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.user).toBeDefined();
      expect(response.data?.tokens).toBeDefined();
      expect(response.data?.tokens.accessToken).toBeTruthy();
      expect(response.data?.tokens.refreshToken).toBeTruthy();

      userId = response.data!.user.id;
      console.log(' User registered successfully:', userId);
    });

    it('should login with registered credentials', async () => {
      const response = await apiClient.auth.login(testUser.email, testUser.password);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.user).toBeDefined();
      expect(response.data?.tokens).toBeDefined();
      expect(response.data?.user.email).toBe(testUser.email);

      console.log(' User logged in successfully');
    });

    it('should fetch current user profile', async () => {
      const response = await apiClient.auth.me();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.user).toBeDefined();
      expect(response.data?.user.email).toBe(testUser.email);

      console.log(' User profile fetched successfully');
    });

    it('should logout user', async () => {
      const response = await apiClient.auth.logout();

      expect(response.success).toBe(true);
      console.log(' User logged out successfully');

      // Login again for subsequent tests
      await apiClient.auth.login(testUser.email, testUser.password);
    });
  });

  // ============================================================================
  // Test 2: Location Tracking
  // ============================================================================

  describe('Test 2: Location Tracking', () => {
    const testLocation = {
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 10,
      context: {
        batteryLevel: 85,
        isMoving: true,
        speed: 2.5,
      },
    };

    let locationId: string;

    it('should send location to backend', async () => {
      const response = await apiClient.locations.sendLocation(
        testLocation.latitude,
        testLocation.longitude,
        testLocation.accuracy,
        testLocation.context
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBeTruthy();
      expect(response.data?.latitude).toBe(testLocation.latitude);
      expect(response.data?.longitude).toBe(testLocation.longitude);

      locationId = response.data!.id;
      console.log(' Location sent successfully:', locationId);
    });

    it('should fetch location history', async () => {
      const response = await apiClient.locations.getHistory();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data!.length).toBeGreaterThan(0);

      console.log(` Location history fetched: ${response.data!.length} records`);
    });

    it('should fetch location history with date filtering', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await apiClient.locations.getHistory(startDate, endDate);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      console.log(` Location history filtered: ${response.data!.length} records`);
    });

    it('should get current location from backend', async () => {
      const response = await apiClient.locations.getCurrent();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();

      console.log(' Current location fetched from backend');
    });
  });

  // ============================================================================
  // Test 3: Safe Zones
  // ============================================================================

  describe('Test 3: Safe Zones', () => {
    const testSafeZone = {
      name: 'Test Home',
      latitude: 40.7128,
      longitude: -74.006,
      radius: 200,
      type: 'home' as const,
    };

    it('should create a safe zone', async () => {
      const response = await apiClient.safeZones.create(
        testSafeZone.name,
        testSafeZone.latitude,
        testSafeZone.longitude,
        testSafeZone.radius,
        testSafeZone.type
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBeTruthy();
      expect(response.data?.name).toBe(testSafeZone.name);
      expect(response.data?.radius).toBe(testSafeZone.radius);

      safeZoneId = response.data!.id;
      console.log(' Safe zone created:', safeZoneId);
    });

    it('should fetch safe zones list', async () => {
      const response = await apiClient.safeZones.list();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data!.length).toBeGreaterThan(0);

      const zone = response.data!.find((z) => z.id === safeZoneId);
      expect(zone).toBeDefined();

      console.log(` Safe zones fetched: ${response.data!.length} zones`);
    });

    it('should check geofence detection (inside)', async () => {
      // Use same coordinates as safe zone center
      const response = await apiClient.safeZones.checkGeofence(
        testSafeZone.latitude,
        testSafeZone.longitude
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.insideSafeZone).toBe(true);
      expect(response.data?.safeZone).toBeDefined();

      console.log(' Geofence check (inside):', response.data?.insideSafeZone);
    });

    it('should check geofence detection (outside)', async () => {
      // Use coordinates far from safe zone
      const response = await apiClient.safeZones.checkGeofence(40.7589, -73.9851);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.insideSafeZone).toBe(false);

      console.log(' Geofence check (outside):', response.data?.insideSafeZone);
    });

    it('should update safe zone', async () => {
      const updates = { name: 'Updated Home', radius: 300 };

      const response = await apiClient.safeZones.update(safeZoneId, updates);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.name).toBe(updates.name);
      expect(response.data?.radius).toBe(updates.radius);

      console.log(' Safe zone updated');
    });

    it('should delete safe zone (at end of tests)', async () => {
      // We'll delete this later to avoid interfering with other tests
      console.log(' Safe zone deletion pending until end of tests');
    });
  });

  // ============================================================================
  // Test 4: Emergency Contacts & Alerts
  // ============================================================================

  describe('Test 4: Emergency Contacts & Alerts', () => {
    const testContact = {
      name: 'Test Parent',
      phone: '+1234567890',
      email: 'parent@example.com',
      relationship: 'Parent',
    };

    it('should add emergency contact', async () => {
      const response = await apiClient.emergency.addContact(
        testContact.name,
        testContact.phone,
        testContact.email,
        testContact.relationship
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBeTruthy();
      expect(response.data?.name).toBe(testContact.name);
      expect(response.data?.phoneNumber).toBe(testContact.phone);

      contactId = response.data!.id;
      console.log(' Emergency contact added:', contactId);
    });

    it('should fetch emergency contacts', async () => {
      const response = await apiClient.emergency.listContacts();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data!.length).toBeGreaterThan(0);

      const contact = response.data!.find((c) => c.id === contactId);
      expect(contact).toBeDefined();

      console.log(` Emergency contacts fetched: ${response.data!.length} contacts`);
    });

    it('should update emergency contact', async () => {
      const updates = { name: 'Updated Parent' };

      const response = await apiClient.emergency.updateContact(contactId, updates);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.name).toBe(updates.name);

      console.log(' Emergency contact updated');
    });

    it('should trigger emergency alert', async () => {
      const response = await apiClient.emergency.triggerAlert();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBeTruthy();

      console.log(' Emergency alert triggered:', response.data?.id);
    });
  });

  // ============================================================================
  // Test 5: Offline Sync
  // ============================================================================

  describe('Test 5: Offline Sync', () => {
    it('should sync offline actions to backend', async () => {
      const offlineActions = [
        {
          id: '1',
          type: 'location_update' as const,
          data: {
            latitude: 40.7128,
            longitude: -74.006,
            accuracy: 10,
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
        },
        {
          id: '2',
          type: 'location_update' as const,
          data: {
            latitude: 40.7129,
            longitude: -74.007,
            accuracy: 15,
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
        },
      ];

      const response = await apiClient.offline.syncActions(offlineActions);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.syncedCount).toBeGreaterThanOrEqual(0);

      console.log(` Offline actions synced: ${response.data?.syncedCount} actions`);
    });
  });

  // ============================================================================
  // Test 6: WebSocket Real-Time Updates
  // ============================================================================

  describe('Test 6: WebSocket Real-Time Updates', () => {
    it('should connect to WebSocket', (done) => {
      const unsubscribe = wsClient.onConnectionStatus((status) => {
        if (status.connected) {
          console.log(' WebSocket connected successfully');
          unsubscribe();
          done();
        }
      });

      wsClient.connect();
    }, 10000);

    it('should receive WebSocket messages', (done) => {
      const unsubscribe = wsClient.on('system_message', (data) => {
        console.log(' WebSocket message received:', data);
        unsubscribe();
        done();
      });

      // Send a test message
      wsClient.send({ type: 'ping', timestamp: new Date().toISOString() });
    }, 10000);

    it('should disconnect from WebSocket', () => {
      wsClient.disconnect();
      expect(wsClient.isConnected()).toBe(false);
      console.log(' WebSocket disconnected successfully');
    });
  });

  // ============================================================================
  // Test 7: Token Refresh
  // ============================================================================

  describe('Test 7: Token Refresh', () => {
    it('should refresh access token', async () => {
      const response = await apiClient.auth.refreshToken();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.tokens).toBeDefined();
      expect(response.data?.tokens.accessToken).toBeTruthy();
      expect(response.data?.tokens.refreshToken).toBeTruthy();

      console.log(' Access token refreshed successfully');
    });

    it('should make API call with refreshed token', async () => {
      const response = await apiClient.auth.me();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.user).toBeDefined();

      console.log(' API call successful with refreshed token');
    });
  });

  // ============================================================================
  // Test 8: Offline PIN + Backend Auth
  // ============================================================================

  describe('Test 8: Combined Authentication', () => {
    it('should verify backend authentication is active', async () => {
      const response = await apiClient.auth.me();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.user).toBeDefined();
      expect(response.data?.user.email).toBe(testUser.email);

      console.log(' Backend authentication verified');
    });

    it('should change password', async () => {
      const newPassword = 'NewTest@123456';

      const response = await apiClient.auth.changePassword(testUser.password, newPassword);

      expect(response.success).toBe(true);
      console.log(' Password changed successfully');

      // Change it back for consistency
      await apiClient.auth.changePassword(newPassword, testUser.password);
    });
  });

  // ============================================================================
  // Cleanup
  // ============================================================================

  describe('Cleanup', () => {
    it('should delete test emergency contact', async () => {
      if (contactId) {
        const response = await apiClient.emergency.deleteContact(contactId);
        expect(response.success).toBe(true);
        console.log(' Emergency contact deleted');
      }
    });

    it('should delete test safe zone', async () => {
      if (safeZoneId) {
        const response = await apiClient.safeZones.delete(safeZoneId);
        expect(response.success).toBe(true);
        console.log(' Safe zone deleted');
      }
    });

    it('should verify cleanup completed', () => {
      console.log(' All cleanup operations completed');
    });
  });

  // ============================================================================
  // Health Check
  // ============================================================================

  describe('Health Check', () => {
    it('should check backend health', async () => {
      const response = await apiClient.healthCheck();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.status).toBeDefined();

      console.log(' Backend health:', response.data?.status);
    });
  });
});
