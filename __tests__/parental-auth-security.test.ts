/**
 * Security tests for parental authentication
 * Tests PIN hashing, rate limiting, session timeout, and secure storage
 */

// Mock dependencies BEFORE imports
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(),
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

// Mock the new storage layer (mainStorage) with a simple in-memory map so tests
// can assert against the StorageManager API instead of AsyncStorage.
const mockStorageMap = new Map<string, any>();
const mockMainStorage = {
  set: jest.fn((k: string, v: any) => mockStorageMap.set(k, v)),
  get: jest.fn((k: string) => (mockStorageMap.has(k) ? mockStorageMap.get(k) : undefined)),
  delete: jest.fn((k: string) => mockStorageMap.delete(k)),
  getAllKeys: jest.fn(() => Array.from(mockStorageMap.keys())),
} as any;

jest.mock('@/utils/storage', () => ({
  mainStorage: mockMainStorage,
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useParentalStore, ParentalProvider } from '@/stores/parentalStore';
import React from 'react';

// Get the mocked Crypto module
const Crypto = require('expo-crypto');

describe('Parental Authentication Security', () => {
  // Create a proper AsyncStorage mock that persists data
  const asyncStorageData: Record<string, string> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Clear the mock storage
    Object.keys(asyncStorageData).forEach((key) => delete asyncStorageData[key]);

    // Mock AsyncStorage with actual storage behavior
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(asyncStorageData[key] || null),
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      asyncStorageData[key] = value;
      return Promise.resolve();
    });
    (AsyncStorage.removeItem as jest.Mock).mockImplementation((key: string) => {
      delete asyncStorageData[key];
      return Promise.resolve();
    });

    // Mock SecureStore
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

    // Mock Crypto
    (Crypto.getRandomBytesAsync as jest.Mock).mockResolvedValue(
      new Uint8Array(32).fill(1), // Predictable salt for testing
    );
    (Crypto.digestStringAsync as jest.Mock).mockImplementation(
      async (_algorithm: any, data: string) => {
        // Simple mock hash function
        return `hashed_${data}`;
      },
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(ParentalProvider, null, children);
  };

  describe('PIN Hashing', () => {
    it('should hash PIN before storing', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await act(async () => {
        await result.current.setParentPin('1234');
      });

      // Verify PIN was hashed with crypto
      expect(Crypto.digestStringAsync).toHaveBeenCalled();

      // Verify hash and salt stored in SecureStore, not AsyncStorage
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('kidmap_pin_hash', expect.any(String));
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('kidmap_pin_salt', expect.any(String));
    });

    it('should validate PIN format (4-6 digits)', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      // Test invalid PINs
      await expect(result.current.setParentPin('123')).rejects.toThrow('PIN must be 4-6 digits');

      await expect(result.current.setParentPin('1234567')).rejects.toThrow(
        'PIN must be 4-6 digits',
      );

      await expect(result.current.setParentPin('abcd')).rejects.toThrow('PIN must be 4-6 digits');

      // Valid PIN should not throw
      await act(async () => {
        await result.current.setParentPin('1234');
      });
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('should use secure random salt generation', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await act(async () => {
        await result.current.setParentPin('1234');
      });

      // Verify random bytes were generated for salt
      expect(Crypto.getRandomBytesAsync).toHaveBeenCalledWith(32);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Setup: PIN is already configured
      (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
        if (key === 'kidmap_pin_hash') return 'hashed_1234correct_salt';
        if (key === 'kidmap_pin_salt') return 'correct_salt';
        return null;
      });
    });

    it('should track failed authentication attempts', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      // First failed attempt
      await act(async () => {
        const success = await result.current.authenticateParentMode('9999');
        expect(success).toBe(false);
      });

      // Verify attempt was tracked in the new storage layer
      expect(mockMainStorage.set).toHaveBeenCalledWith(
        'kidmap_auth_attempts',
        expect.objectContaining({ count: 1 }),
      );
    });

    it('should lock account after 5 failed attempts', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      // Attempt 1-4: Should fail but not lock
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          await result.current.authenticateParentMode('9999');
        });
      }

      // Attempt 5: Should lock the account
      await expect(result.current.authenticateParentMode('9999')).rejects.toThrow(
        'Account locked for 15 minutes',
      );
    });

    it('should prevent authentication during lockout period', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      // Trigger lockout
      for (let i = 0; i < 5; i++) {
        try {
          await act(async () => {
            await result.current.authenticateParentMode('9999');
          });
        } catch (error) {
          // Expected to fail on 5th attempt
        }
      }

      // Try to authenticate during lockout
      await expect(result.current.authenticateParentMode('1234')).rejects.toThrow(
        'Too many failed attempts',
      );
    });

    it('should reset attempts after successful authentication', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      // Make some failed attempts
      await act(async () => {
        await result.current.authenticateParentMode('9999');
        await result.current.authenticateParentMode('9999');
      });

      // Successful authentication
      await act(async () => {
        const success = await result.current.authenticateParentMode('1234');
        expect(success).toBe(true);
      });

      // Verify attempts were reset in the new storage layer
      expect(mockMainStorage.delete).toHaveBeenCalledWith('kidmap_auth_attempts');
    });

    it('should allow authentication after lockout expires', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      // Trigger lockout
      for (let i = 0; i < 5; i++) {
        try {
          await act(async () => {
            await result.current.authenticateParentMode('9999');
          });
        } catch (error) {
          // Expected
        }
      }

      // Fast-forward past lockout period (15 minutes)
      act(() => {
        jest.advanceTimersByTime(15 * 60 * 1000 + 1000);
      });

      // Should be able to authenticate now
      await act(async () => {
        const success = await result.current.authenticateParentMode('1234');
        expect(success).toBe(true);
      });
    });
  });

  describe('Session Timeout', () => {
    beforeEach(() => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
        if (key === 'kidmap_pin_hash') return 'hashed_1234correct_salt';
        if (key === 'kidmap_pin_salt') return 'correct_salt';
        return null;
      });
    });

    it('should auto-logout after 30 minutes of inactivity', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      // Authenticate successfully
      await act(async () => {
        await result.current.authenticateParentMode('1234');
      });

      expect(result.current.isParentMode).toBe(true);

      // Fast-forward 30 minutes and run the timer callback
      await act(async () => {
        jest.advanceTimersByTime(30 * 60 * 1000);
      });

      // Should be logged out (no need for waitFor - act handles state updates)
      expect(result.current.isParentMode).toBe(false);
    });

    it('should clear timeout when manually logging out', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await act(async () => {
        await result.current.authenticateParentMode('1234');
      });

      expect(result.current.isParentMode).toBe(true);

      // Manual logout
      act(() => {
        result.current.exitParentMode();
      });

      expect(result.current.isParentMode).toBe(false);

      // Fast-forward 30 minutes - should not cause any issues
      act(() => {
        jest.advanceTimersByTime(30 * 60 * 1000);
      });

      // Should still be logged out (no double logout)
      expect(result.current.isParentMode).toBe(false);
    });
  });

  describe('Secure Storage', () => {
    it('should never store PIN in plain text', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await act(async () => {
        await result.current.setParentPin('1234');
      });

      // Check all AsyncStorage calls
      const asyncStorageCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      asyncStorageCalls.forEach(([_key, value]) => {
        // Value should not contain plain PIN
        expect(value).not.toContain('1234');
      });
    });

    it('should use SecureStore for sensitive data', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await act(async () => {
        await result.current.setParentPin('1234');
      });

      // Verify SecureStore was used (encrypted storage)
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('kidmap_pin_hash', expect.any(String));
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('kidmap_pin_salt', expect.any(String));
    });

    it('should handle first-time setup (no PIN configured)', async () => {
      const { result } = renderHook(() => useParentalStore(), { wrapper });

      // No PIN stored yet
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      // Should allow access for initial setup
      await act(async () => {
        const success = await result.current.authenticateParentMode('any-pin');
        expect(success).toBe(true);
      });
    });
  });

  describe('Security Logging', () => {
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    afterEach(() => {
      consoleInfoSpy.mockClear();
      consoleWarnSpy.mockClear();
    });

    it('should log successful authentication', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
        if (key === 'kidmap_pin_hash') return 'hashed_1234correct_salt';
        if (key === 'kidmap_pin_salt') return 'correct_salt';
        return null;
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      await act(async () => {
        await result.current.authenticateParentMode('1234');
      });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Security] Parent mode authenticated successfully'),
      );
    });

    it('should log lockout events', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
        if (key === 'kidmap_pin_hash') return 'hashed_1234correct_salt';
        if (key === 'kidmap_pin_salt') return 'correct_salt';
        return null;
      });

      const { result } = renderHook(() => useParentalStore(), { wrapper });

      // Trigger lockout
      for (let i = 0; i < 5; i++) {
        try {
          await act(async () => {
            await result.current.authenticateParentMode('9999');
          });
        } catch (error) {
          // Expected
        }
      }

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Security] Maximum authentication attempts exceeded'),
      );
    });
  });
});
