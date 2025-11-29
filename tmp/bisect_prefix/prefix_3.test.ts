import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ParentalProvider, useParentalStore } from '../parentalStore';
import React from 'react';
import type { SafeZone, CheckInRequest, EmergencyContact, DevicePingRequest } from '@/types/parental';

// Mock modules
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(),
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}));

jest.mock('@/utils/storage', () => ({
  mainStorage: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('parentalStore', () => {
  let AsyncStorage: any;
  let SecureStore: any;
  let Crypto: any;
  let mainStorage: any;

  beforeAll(() => {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
    SecureStore = require('expo-secure-store');
    Crypto = require('expo-crypto');
    mainStorage = require('@/utils/storage').mainStorage;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);
    AsyncStorage.removeItem.mockResolvedValue(undefined);

    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue(undefined);

    mainStorage.get.mockReturnValue(null);
    mainStorage.set.mockReturnValue(undefined);
    mainStorage.delete.mockReturnValue(undefined);

    // Mock crypto functions
    Crypto.getRandomBytesAsync.mockImplementation((length: number) => {
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      return Promise.resolve(bytes);
    });

    Crypto.digestStringAsync.mockImplementation((algorithm: string, data: string) => {
      // Simple mock hash - in real tests we'd use a consistent hash
      return Promise.resolve(`hashed_${data}`);
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(ParentalProvider, null, children);

  describe('Initialization', () => {
    it('initializes with default state', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings).toBeDefined();
      expect(result.current.settings.requirePinForParentMode).toBe(true);
      expect(result.current.settings.allowChildCategoryCreation).toBe(true);
      expect(result.current.safeZones).toEqual([]);
      expect(result.current.checkInRequests).toEqual([]);
      expect(result.current.isParentMode).toBe(false);
    });

    it('loads stored settings from AsyncStorage', async () => {
      const storedSettings = {
        requirePinForParentMode: false,
        allowChildCategoryCreation: false,
        requireApprovalForCategories: false,
        maxCustomCategories: 10,
        safeZoneAlerts: false,
        checkInReminders: false,
        emergencyContacts: [],
      };

      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'kidmap_parental_settings') {
          return Promise.resolve(JSON.stringify(storedSettings));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings.requirePinForParentMode).toBe(false);
      expect(result.current.settings.maxCustomCategories).toBe(10);
    });

    it('loads safe zones from AsyncStorage', async () => {
      const storedSafeZones: SafeZone[] = [
        {
          id: 'zone1',
          name: 'Home',
          latitude: 40.7128,
          longitude: -74.006,
          radius: 100,
          isActive: true,
          createdAt: Date.now(),
          notifications: { onEntry: true, onExit: true },
        },
      ];

      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'kidmap_safe_zones') {
          return Promise.resolve(JSON.stringify(storedSafeZones));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.safeZones).toHaveLength(1);
      expect(result.current.safeZones[0].name).toBe('Home');
    });
  });

  describe('PIN Authentication', () => {
    it.skip('allows access when PIN is not required', async () => {
      const storedSettings = {
        requirePinForParentMode: false,
        allowChildCategoryCreation: true,
        requireApprovalForCategories: true,
        maxCustomCategories: 20,
        safeZoneAlerts: true,
        checkInReminders: true,
        emergencyContacts: [],
      };

      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'kidmap_parental_settings') {
          return Promise.resolve(JSON.stringify(storedSettings));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success = false;
      await act(async () => {
        success = await result.current.authenticateParentMode('1234');
      });

      expect(success).toBe(true);
      expect(result.current.isParentMode).toBe(true);
    });

    it.skip('allows access when no PIN is set (first-time setup)', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success = false;
      await act(async () => {
        success = await result.current.authenticateParentMode('1234');
      });

      expect(success).toBe(true);
      expect(result.current.isParentMode).toBe(true);
    });

    it.skip('sets a new PIN with secure hashing', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setParentPin('1234');
      });

      expect(Crypto.getRandomBytesAsync).toHaveBeenCalledWith(32);
      expect(Crypto.digestStringAsync).toHaveBeenCalled();
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'kidmap_pin_hash',
        expect.any(String),
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'kidmap_pin_salt',
        expect.any(String),
      );
    });

    it.skip('rejects invalid PINs during setup', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.setParentPin('12'); // Too short
        }),
      ).rejects.toThrow('PIN must be 4-6 digits');

      await expect(
        act(async () => {
          await result.current.setParentPin('abc123'); // Not all digits
        }),
      ).rejects.toThrow('PIN must be 4-6 digits');
    });

    it.skip('authenticates with correct PIN', async () => {
      const salt = 'test_salt_123';
      const pin = '1234';
      const hashedPin = `hashed_${pin}${salt}`;

      SecureStore.getItemAsync.mockImplementation((key: string) => {
        if (key === 'kidmap_pin_hash') return Promise.resolve(hashedPin);
        if (key === 'kidmap_pin_salt') return Promise.resolve(salt);
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success = false;
      await act(async () => {
        success = await result.current.authenticateParentMode(pin);
      });

      expect(success).toBe(true);
      expect(result.current.isParentMode).toBe(true);
    });

    it.skip('rejects incorrect PIN', async () => {
      const salt = 'test_salt_123';
      const correctPin = '1234';
      const wrongPin = '5678';
      const hashedCorrectPin = `hashed_${correctPin}${salt}`;

      SecureStore.getItemAsync.mockImplementation((key: string) => {
        if (key === 'kidmap_pin_hash') return Promise.resolve(hashedCorrectPin);
        if (key === 'kidmap_pin_salt') return Promise.resolve(salt);
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success = false;
      await act(async () => {
        success = await result.current.authenticateParentMode(wrongPin);
      });

      expect(success).toBe(false);
      expect(result.current.isParentMode).toBe(false);
    });

    it.skip('implements rate limiting after multiple failed attempts', async () => {
      const salt = 'test_salt_123';
      const correctPin = '1234';
      const wrongPin = '5678';
      const hashedCorrectPin = `hashed_${correctPin}${salt}`;

      SecureStore.getItemAsync.mockImplementation((key: string) => {
        if (key === 'kidmap_pin_hash') return Promise.resolve(hashedCorrectPin);
        if (key === 'kidmap_pin_salt') return Promise.resolve(salt);
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Attempt 5 failed logins
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          try {
            await result.current.authenticateParentMode(wrongPin);
          } catch (e) {
            // Expect lockout on 5th attempt
            if (i === 4) {
              expect((e as Error).message).toContain('Too many failed attempts');
            }
          }
        });
      }

      // 6th attempt should be blocked
      await expect(
        act(async () => {
          await result.current.authenticateParentMode(wrongPin);
        }),
      ).rejects.toThrow('Too many failed attempts');
    });

    it.skip('exits parent mode', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First authenticate
      await act(async () => {
        await result.current.authenticateParentMode('1234');
      });

      expect(result.current.isParentMode).toBe(true);

      // Then exit
      act(() => {
        result.current.exitParentMode();
      });

      expect(result.current.isParentMode).toBe(false);
    });
  });

  describe('Safe Zone Management', () => {
    it.skip('adds a new safe zone', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newSafeZone = {
        name: 'School',
        latitude: 40.7128,
        longitude: -74.006,
        radius: 200,
        isActive: true,
        notifications: { onEntry: true, onExit: false },
      };

      let createdZone: SafeZone | undefined;
      await act(async () => {
        createdZone = await result.current.addSafeZone(newSafeZone);
      });

      expect(createdZone).toBeDefined();
      expect(createdZone?.name).toBe('School');
      expect(createdZone?.id).toBeDefined();
      expect(result.current.safeZones).toHaveLength(1);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'kidmap_safe_zones',
        expect.any(String),
      );
    });

    it.skip('updates an existing safe zone', async () => {
      const existingSafeZone: SafeZone = {
        id: 'zone1',
        name: 'Home',
        latitude: 40.7128,
        longitude: -74.006,
        radius: 100,
        isActive: true,
        createdAt: Date.now(),
        notifications: { onEntry: true, onExit: true },
      };

      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'kidmap_safe_zones') {
          return Promise.resolve(JSON.stringify([existingSafeZone]));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSafeZone('zone1', { name: 'Updated Home', radius: 150 });
      });

      expect(result.current.safeZones[0].name).toBe('Updated Home');
      expect(result.current.safeZones[0].radius).toBe(150);
    });

    it.skip('deletes a safe zone', async () => {
      const existingSafeZones: SafeZone[] = [
        {
          id: 'zone1',
          name: 'Home',
          latitude: 40.7128,
          longitude: -74.006,
          radius: 100,
          isActive: true,
          createdAt: Date.now(),
          notifications: { onEntry: true, onExit: true },
        },
        {
          id: 'zone2',
          name: 'School',
          latitude: 40.7228,
          longitude: -74.016,
          radius: 200,
          isActive: true,
          createdAt: Date.now(),
          notifications: { onEntry: true, onExit: false },
        },
      ];

      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'kidmap_safe_zones') {
          return Promise.resolve(JSON.stringify(existingSafeZones));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.safeZones).toHaveLength(2);

      await act(async () => {
        await result.current.deleteSafeZone('zone1');
      });

      expect(result.current.safeZones).toHaveLength(1);
      expect(result.current.safeZones[0].id).toBe('zone2');
    });
  });

  describe('Check-In Requests', () => {
    it.skip('creates a new check-in request', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let request: CheckInRequest | undefined;
      await act(async () => {
        request = await result.current.requestCheckIn('Where are you?', false);
      });

      expect(request).toBeDefined();
      expect(request?.message).toBe('Where are you?');
      expect(request?.status).toBe('pending');
      expect(result.current.checkInRequests).toHaveLength(1);
    });

    it.skip('creates urgent check-in requests', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let request: CheckInRequest | undefined;
      await act(async () => {
        request = await result.current.requestCheckIn('URGENT: Check in now!', true);
      });

      expect(request?.isUrgent).toBe(true);
    });

    it.skip('completes a check-in request', async () => {
      const existingRequest: CheckInRequest = {
        id: 'request1',
        childId: 'child1',
        requestedAt: Date.now(),
        message: 'Where are you?',
        isUrgent: false,
        status: 'pending',
      };

      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'kidmap_check_in_requests') {
          return Promise.resolve(JSON.stringify([existingRequest]));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const location = { latitude: 40.7128, longitude: -74.006, placeName: 'Central Park' };

      await act(async () => {
        await result.current.completeCheckIn('request1', location);
      });

      const updated = result.current.checkInRequests.find((r) => r.id === 'request1');
      expect(updated?.status).toBe('completed');
      expect(updated?.location).toEqual(location);
      expect(updated?.completedAt).toBeDefined();
    });
  });

  describe('Emergency Contacts', () => {
    it.skip('adds an emergency contact', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newContact = {
        name: 'John Doe',
        phone: '555-1234',
        relationship: 'Father',
        isPrimary: true,
        canReceiveAlerts: true,
      };

      let contact: EmergencyContact | undefined;
      await act(async () => {
        contact = await result.current.addEmergencyContact(newContact);
      });

      expect(contact).toBeDefined();
      expect(contact?.name).toBe('John Doe');
      expect(result.current.settings.emergencyContacts.length).toBeGreaterThan(0);
    });

    it.skip('updates an emergency contact', async () => {
      const existingContact: EmergencyContact = {
        id: 'contact1',
        name: 'John Doe',
        phone: '555-1234',
        relationship: 'Father',
        isPrimary: true,
        canReceiveAlerts: true,
      };

      const storedSettings = {
        requirePinForParentMode: true,
        allowChildCategoryCreation: true,
        requireApprovalForCategories: true,
        maxCustomCategories: 20,
        safeZoneAlerts: true,
        checkInReminders: true,
        emergencyContacts: [existingContact],
      };

      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'kidmap_parental_settings') {
          return Promise.resolve(JSON.stringify(storedSettings));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateEmergencyContact('contact1', { phone: '555-5678' });
      });

      const updated = result.current.settings.emergencyContacts.find((c) => c.id === 'contact1');
      expect(updated?.phone).toBe('555-5678');
    });

    it.skip('deletes an emergency contact', async () => {
      const existingContacts: EmergencyContact[] = [
        {
          id: 'contact1',
          name: 'John Doe',
          phone: '555-1234',
          relationship: 'Father',
          isPrimary: true,
          canReceiveAlerts: true,
        },
        {
          id: 'contact2',
          name: 'Jane Doe',
          phone: '555-5678',
          relationship: 'Mother',
          isPrimary: false,
          canReceiveAlerts: true,
        },
      ];

      const storedSettings = {
        requirePinForParentMode: true,
        allowChildCategoryCreation: true,
        requireApprovalForCategories: true,
        maxCustomCategories: 20,
        safeZoneAlerts: true,
        checkInReminders: true,
        emergencyContacts: existingContacts,
      };

      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'kidmap_parental_settings') {
          return Promise.resolve(JSON.stringify(storedSettings));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.settings.emergencyContacts.length;

      await act(async () => {
        await result.current.deleteEmergencyContact('contact1');
      });

      expect(result.current.settings.emergencyContacts.length).toBe(initialCount - 1);
      expect(result.current.settings.emergencyContacts.find((c) => c.id === 'contact1')).toBeUndefined();
    });
  });

  describe('Device Pings', () => {
    it.skip('sends a location ping', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let ping: DevicePingRequest | undefined;
      await act(async () => {
        ping = await result.current.sendDevicePing('location');
      });

      expect(ping).toBeDefined();
      expect(ping?.type).toBe('location');
      expect(ping?.status).toBe('pending');
      expect(result.current.devicePings).toHaveLength(1);
    });

    it.skip('sends a ring ping', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let ping: DevicePingRequest | undefined;
      await act(async () => {
        ping = await result.current.sendDevicePing('ring');
      });

      expect(ping?.type).toBe('ring');
    });

    it.skip('sends a message ping', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let ping: DevicePingRequest | undefined;
      await act(async () => {
        ping = await result.current.sendDevicePing('message', 'Please call me');
      });

      expect(ping?.type).toBe('message');
      expect(ping?.message).toBe('Please call me');
    });

    it.skip('acknowledges a ping', async () => {
      const existingPing: DevicePingRequest = {
        id: 'ping1',
        type: 'location',
        requestedAt: Date.now(),
        status: 'pending',
      };

      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'kidmap_device_pings') {
          return Promise.resolve(JSON.stringify([existingPing]));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const location = { latitude: 40.7128, longitude: -74.006 };

      await act(async () => {
        await result.current.acknowledgePing('ping1', location);
      });

      const updated = result.current.devicePings.find((p) => p.id === 'ping1');
      expect(updated?.status).toBe('acknowledged');
      expect(updated?.response?.location).toEqual(location);
      expect(updated?.response?.timestamp).toBeDefined();
    });
  });

  describe('Dashboard Data', () => {
    it.skip('adds check-in to dashboard', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const checkIn = {
        id: 'checkin1',
        timestamp: Date.now(),
        placeName: 'School',
        location: { latitude: 40.7128, longitude: -74.006 },
      };

      act(() => {
        result.current.addCheckInToDashboard(checkIn);
      });

      // Wait for async storage save
      await waitFor(() => {
        expect(result.current.dashboardData.recentCheckIns).toHaveLength(1);
      });

      expect(result.current.dashboardData.recentCheckIns[0].placeName).toBe('School');
    });

    it.skip('updates last known location', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const location = {
        latitude: 40.7128,
        longitude: -74.006,
        timestamp: Date.now(),
        placeName: 'Central Park',
      };

      act(() => {
        result.current.updateLastKnownLocation(location);
      });

      await waitFor(() => {
        expect(result.current.dashboardData.lastKnownLocation).toBeDefined();
      });

      expect(result.current.dashboardData.lastKnownLocation?.placeName).toBe('Central Park');
    });

    it.skip('keeps only the last 10 check-ins', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add 12 check-ins
      for (let i = 0; i < 12; i++) {
        await act(async () => {
          result.current.addCheckInToDashboard({
            id: `checkin${i}`,
            timestamp: Date.now() + i,
            placeName: `Location ${i}`,
          });
        });
      }

      await waitFor(() => {
        expect(result.current.dashboardData.recentCheckIns.length).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Settings Management', () => {
    it.skip('saves updated settings', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newSettings = {
        ...result.current.settings,
        maxCustomCategories: 30,
        safeZoneAlerts: false,
      };

      await act(async () => {
        await result.current.saveSettings(newSettings);
      });

      expect(result.current.settings.maxCustomCategories).toBe(30);
      expect(result.current.settings.safeZoneAlerts).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'kidmap_parental_settings',
        expect.any(String),
      );
    });
  });

  describe('Security Features', () => {
    it.skip('resets auth attempts after successful authentication', async () => {
      const salt = 'test_salt_123';
      const pin = '1234';
      const hashedPin = `hashed_${pin}${salt}`;

      SecureStore.getItemAsync.mockImplementation((key: string) => {
        if (key === 'kidmap_pin_hash') return Promise.resolve(hashedPin);
        if (key === 'kidmap_pin_salt') return Promise.resolve(salt);
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First fail a few times
      await act(async () => {
        await result.current.authenticateParentMode('wrong');
      });
      await act(async () => {
        await result.current.authenticateParentMode('wrong');
      });

      // Then succeed
      await act(async () => {
        await result.current.authenticateParentMode(pin);
      });

      // Auth attempts should be reset
      expect(mainStorage.delete).toHaveBeenCalledWith('kidmap_auth_attempts');
    });

    it.skip('persists auth attempts to storage', async () => {
      const salt = 'test_salt_123';
      const correctPin = '1234';
      const wrongPin = '5678';
      const hashedCorrectPin = `hashed_${correctPin}${salt}`;

      SecureStore.getItemAsync.mockImplementation((key: string) => {
        if (key === 'kidmap_pin_hash') return Promise.resolve(hashedCorrectPin);
        if (key === 'kidmap_pin_salt') return Promise.resolve(salt);
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.authenticateParentMode(wrongPin);
      });

      expect(mainStorage.set).toHaveBeenCalledWith('kidmap_auth_attempts', {
        count: 1,
        timestamp: expect.any(Number),
      });
    });
  });
});
