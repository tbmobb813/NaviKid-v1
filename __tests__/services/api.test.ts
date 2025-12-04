/**
 * Tests for API Client
 * Validates HTTP requests, authentication, retry logic, and token management
 */

// Mock expo modules FIRST before any imports
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      api: {
        baseUrl: 'http://test-api.example.com/api',
        timeout: 5000,
      },
    },
  },
  default: {
    expoConfig: {
      extra: {
        api: {
          baseUrl: 'http://test-api.example.com/api',
          timeout: 5000,
        },
      },
    },
  },
}), { virtual: true });

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}), { virtual: true });

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('@/utils/logger', () => ({
  log: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

import * as SecureStore from 'expo-secure-store';
import { NaviKidApiClient } from '@/services/api';
import type { ApiResponse, AuthTokens, User, Location, SafeZone, EmergencyContact } from '@/services/api';

describe('NaviKidApiClient', () => {
  let apiClient: any;
  const mockAccessToken = 'mock-access-token';
  const mockRefreshToken = 'mock-refresh-token';

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'parent',
    createdAt: '2025-01-01T00:00:00Z',
  };

  const mockTokens: AuthTokens = {
    accessToken: mockAccessToken,
    refreshToken: mockRefreshToken,
  };

  const mockSuccessResponse = <T>(data: T): ApiResponse<T> => ({
    success: true,
    data,
    meta: {
      timestamp: new Date(),
      requestId: 'req-123',
    },
  });

  const mockErrorResponse = (message: string): ApiResponse => ({
    success: false,
    error: {
      message,
      code: 'ERROR',
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    // Import fresh instance for each test
    jest.resetModules();
    const apiModule = require('@/services/api');
    apiClient = new apiModule.NaviKidApiClient({
      baseUrl: 'http://test-api.example.com/api',
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 100,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      expect(apiClient).toBeDefined();
      expect(apiClient['config'].baseUrl).toBe('http://test-api.example.com/api');
      expect(apiClient['config'].timeout).toBe(5000);
      expect(apiClient['config'].retryAttempts).toBe(3);
    });

    it('should load tokens on initialization', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'access_token') return Promise.resolve(mockAccessToken);
        if (key === 'refresh_token') return Promise.resolve(mockRefreshToken);
        return Promise.resolve(null);
      });

      new (require('@/services/api').NaviKidApiClient)();

      // Give time for async loadTokens to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('access_token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('Token Management', () => {
    describe('saveTokens', () => {
      it('should save tokens to SecureStore on native platforms', async () => {
        await apiClient['saveTokens'](mockTokens);

        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', mockAccessToken);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', mockRefreshToken);
      });

      it('should update internal token state', async () => {
        await apiClient['saveTokens'](mockTokens);

        expect(apiClient['accessToken']).toBe(mockAccessToken);
        expect(apiClient['refreshToken']).toBe(mockRefreshToken);
      });

      it('should handle save errors gracefully', async () => {
        (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

        await expect(apiClient['saveTokens'](mockTokens)).rejects.toThrow('Storage error');
      });
    });

    describe('clearTokens', () => {
      it('should clear tokens from SecureStore', async () => {
        apiClient['accessToken'] = mockAccessToken;
        apiClient['refreshToken'] = mockRefreshToken;

        await apiClient['clearTokens']();

        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
        expect(apiClient['accessToken']).toBeNull();
        expect(apiClient['refreshToken']).toBeNull();
      });
    });

    describe('setAuthToken / clearAuthToken', () => {
      it('should set auth token', () => {
        apiClient.setAuthToken(mockAccessToken);
        expect(apiClient['accessToken']).toBe(mockAccessToken);
      });

      it('should clear auth token', () => {
        apiClient['accessToken'] = mockAccessToken;
        apiClient.clearAuthToken();
        expect(apiClient['accessToken']).toBeNull();
      });
    });
  });

  describe('HTTP Request Methods', () => {
    describe('request', () => {
      it('should make successful GET request', async () => {
        const mockData = { id: '123', name: 'Test' };
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse(mockData),
        });

        const response = await apiClient['request']('/test', { method: 'GET' });

        expect(global.fetch).toHaveBeenCalledWith(
          'http://test-api.example.com/api/test',
          expect.objectContaining({
            method: 'GET',
          })
        );
        expect(response.success).toBe(true);
        expect(response.data).toEqual(mockData);
      });

      it('should include Authorization header when token is set', async () => {
        apiClient['accessToken'] = mockAccessToken;
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse({}),
        });

        await apiClient['request']('/test', { method: 'GET' });

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: `Bearer ${mockAccessToken}`,
            }),
          })
        );
      });

      it('should skip Authorization header when skipAuth is true', async () => {
        apiClient['accessToken'] = mockAccessToken;
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse({}),
        });

        await apiClient['request']('/test', { method: 'GET' }, true);

        const callArgs = (global.fetch as jest.Mock).mock.calls[0];
        expect(callArgs[1].headers.Authorization).toBeUndefined();
      });

      it('should handle timeout errors', async () => {
        (global.fetch as jest.Mock).mockImplementation(() =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100);
          })
        );

        await expect(apiClient['request']('/test', { method: 'GET' }))
          .rejects.toThrow('Request timeout');
      });

      it('should handle 401 errors and attempt token refresh', async () => {
        apiClient['accessToken'] = mockAccessToken;
        apiClient['refreshToken'] = mockRefreshToken;

        // First call returns 401, second call succeeds after refresh
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ error: { message: 'Unauthorized' } }),
          })
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockSuccessResponse({ tokens: mockTokens }),
          })
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockSuccessResponse({ data: 'success' }),
          });

        const response = await apiClient['request']('/test', { method: 'GET' });

        // Should have called fetch 3 times: original, refresh, retry
        expect(global.fetch).toHaveBeenCalledTimes(3);
      });

      it('should clear tokens if refresh fails', async () => {
        apiClient['accessToken'] = mockAccessToken;
        apiClient['refreshToken'] = mockRefreshToken;

        // First call returns 401, refresh also fails
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ error: { message: 'Unauthorized' } }),
          })
          .mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ error: { message: 'Invalid refresh token' } }),
          });

        await expect(apiClient['request']('/test', { method: 'GET' }))
          .rejects.toThrow('Session expired. Please login again.');

        expect(apiClient['accessToken']).toBeNull();
        expect(apiClient['refreshToken']).toBeNull();
      });

      it('should handle non-401 error responses', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => mockErrorResponse('Internal server error'),
        });

        await expect(apiClient['request']('/test', { method: 'GET' }))
          .rejects.toThrow('Internal server error');
      });

      it('should include Content-Type header only when body is provided', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse({}),
        });

        // With body
        await apiClient['request']('/test', {
          method: 'POST',
          body: JSON.stringify({ key: 'value' })
        });

        expect((global.fetch as jest.Mock).mock.calls[0][1].headers['Content-Type'])
          .toBe('application/json');

        // Without body
        (global.fetch as jest.Mock).mockClear();
        await apiClient['request']('/test', { method: 'POST' });

        expect((global.fetch as jest.Mock).mock.calls[0][1].headers['Content-Type'])
          .toBeUndefined();
      });
    });

    describe('requestWithRetry', () => {
      it('should retry on network errors', async () => {
        (global.fetch as jest.Mock)
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockSuccessResponse({ data: 'success' }),
          });

        const response = await apiClient['requestWithRetry']('/test', { method: 'GET' });

        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(response.success).toBe(true);
      });

      it('should not retry on 4xx errors', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('400 Bad Request'));

        await expect(apiClient['requestWithRetry']('/test', { method: 'GET' }))
          .rejects.toThrow('400 Bad Request');

        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      it('should use exponential backoff between retries', async () => {
        const startTime = Date.now();
        (global.fetch as jest.Mock)
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockSuccessResponse({}),
          });

        await apiClient['requestWithRetry']('/test', { method: 'GET' });

        const duration = Date.now() - startTime;
        // Should have waited at least 100ms + 200ms = 300ms
        expect(duration).toBeGreaterThanOrEqual(300);
      });

      it('should throw last error after all retries exhausted', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Persistent network error'));

        await expect(apiClient['requestWithRetry']('/test', { method: 'GET' }))
          .rejects.toThrow('Persistent network error');

        expect(global.fetch).toHaveBeenCalledTimes(3);
      });
    });

    describe('HTTP Method Shortcuts', () => {
      beforeEach(() => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse({}),
        });
      });

      it('should make GET request', async () => {
        await apiClient.get('/test');
        expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('GET');
      });

      it('should make POST request with body', async () => {
        const body = { key: 'value' };
        await apiClient.post('/test', body);

        expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('POST');
        expect((global.fetch as jest.Mock).mock.calls[0][1].body).toBe(JSON.stringify(body));
      });

      it('should make PUT request with body', async () => {
        const body = { key: 'updated' };
        await apiClient.put('/test', body);

        expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('PUT');
        expect((global.fetch as jest.Mock).mock.calls[0][1].body).toBe(JSON.stringify(body));
      });

      it('should make PATCH request with body', async () => {
        const body = { key: 'patched' };
        await apiClient.patch('/test', body);

        expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('PATCH');
        expect((global.fetch as jest.Mock).mock.calls[0][1].body).toBe(JSON.stringify(body));
      });

      it('should make DELETE request', async () => {
        await apiClient.delete('/test');
        expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('DELETE');
      });
    });
  });

  describe('Authentication API', () => {
    describe('register', () => {
      it('should register a new user and save tokens', async () => {
        const mockResponse = mockSuccessResponse({ user: mockUser, tokens: mockTokens });
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        const response = await apiClient.auth.register('test@example.com', 'password123');

        expect(response.success).toBe(true);
        expect(response.data?.user).toEqual(mockUser);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', mockAccessToken);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', mockRefreshToken);
      });

      it('should use skipAuth for registration request', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse({ user: mockUser, tokens: mockTokens }),
        });

        await apiClient.auth.register('test@example.com', 'password123', 'parent');

        const callArgs = (global.fetch as jest.Mock).mock.calls[0];
        expect(callArgs[1].headers.Authorization).toBeUndefined();
      });
    });

    describe('login', () => {
      it('should login and save tokens', async () => {
        const mockResponse = mockSuccessResponse({ user: mockUser, tokens: mockTokens });
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        const response = await apiClient.auth.login('test@example.com', 'password123');

        expect(response.success).toBe(true);
        expect(response.data?.user).toEqual(mockUser);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', mockAccessToken);
      });
    });

    describe('logout', () => {
      it('should logout and clear tokens', async () => {
        apiClient['refreshToken'] = mockRefreshToken;
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse(undefined),
        });

        await apiClient.auth.logout();

        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
      });
    });

    describe('refreshToken', () => {
      it('should refresh access token', async () => {
        apiClient['refreshToken'] = mockRefreshToken;
        const newTokens = {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse({ tokens: newTokens }),
        });

        const response = await apiClient.auth.refreshToken();

        expect(response.success).toBe(true);
        expect(apiClient['accessToken']).toBe(newTokens.accessToken);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', newTokens.accessToken);
      });

      it('should handle response with only accessToken (no refreshToken)', async () => {
        apiClient['refreshToken'] = mockRefreshToken;

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse({
            accessToken: 'new-access-only',
            expiresIn: 3600,
          }),
        });

        const response = await apiClient.auth.refreshToken();

        expect(response.success).toBe(true);
        expect(response.data?.tokens?.accessToken).toBe('new-access-only');
        expect(response.data?.tokens?.refreshToken).toBe(mockRefreshToken);
      });

      it('should throw error if no refresh token available', async () => {
        apiClient['refreshToken'] = null;

        await expect(apiClient.auth.refreshToken())
          .rejects.toThrow('No refresh token available');
      });
    });

    describe('me', () => {
      it('should fetch current user', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse({ user: mockUser }),
        });

        const response = await apiClient.auth.me();

        expect(response.success).toBe(true);
        expect(response.data?.user).toEqual(mockUser);
      });
    });

    describe('changePassword', () => {
      it('should change user password', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse(undefined),
        });

        const response = await apiClient.auth.changePassword('oldpass', 'newpass');

        expect(response.success).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/change-password'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });
  });

  describe('Locations API', () => {
    const mockLocation: Location = {
      id: 'loc-123',
      userId: 'user-123',
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 20,
      timestamp: '2025-01-01T00:00:00Z',
      context: {
        batteryLevel: 75,
        isMoving: true,
      },
    };

    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse(mockLocation),
      });
    });

    describe('sendLocation', () => {
      it('should send location with context', async () => {
        const context = { batteryLevel: 80, isMoving: false };
        await apiClient.locations.sendLocation(40.7128, -74.006, 20, context);

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.latitude).toBe(40.7128);
        expect(callBody.longitude).toBe(-74.006);
        expect(callBody.accuracy).toBe(20);
        expect(callBody.timestamp).toBeDefined();
        expect(callBody.context).toEqual(context);
      });

      it('should include timestamp in payload', async () => {
        await apiClient.locations.sendLocation(40.7128, -74.006, 20);

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.timestamp).toBeDefined();
        expect(new Date(callBody.timestamp).getTime()).toBeGreaterThan(0);
      });
    });

    describe('getHistory', () => {
      it('should fetch location history with date filters', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse([mockLocation]),
        });

        await apiClient.locations.getHistory('2025-01-01', '2025-01-31');

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/locations/history?startDate=2025-01-01&endDate=2025-01-31'),
          expect.any(Object)
        );
      });

      it('should fetch location history without filters', async () => {
        await apiClient.locations.getHistory();

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/locations/history'),
          expect.any(Object)
        );
      });
    });

    describe('getCurrent', () => {
      it('should fetch current location', async () => {
        const response = await apiClient.locations.getCurrent();

        expect(response.success).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/locations/current'),
          expect.any(Object)
        );
      });
    });

    describe('delete', () => {
      it('should delete location by id', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse(undefined),
        });

        await apiClient.locations.delete('loc-123');

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/locations/loc-123'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });
  });

  describe('Safe Zones API', () => {
    const mockSafeZone: SafeZone = {
      id: 'zone-123',
      userId: 'user-123',
      name: 'Home',
      centerLatitude: 40.7128,
      centerLongitude: -74.006,
      radius: 100,
      type: 'home',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse(mockSafeZone),
      });
    });

    describe('list', () => {
      it('should fetch all safe zones', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse([mockSafeZone]),
        });

        const response = await apiClient.safeZones.list();

        expect(response.success).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/safe-zones'),
          expect.any(Object)
        );
      });
    });

    describe('create', () => {
      it('should create a new safe zone', async () => {
        await apiClient.safeZones.create('Home', 40.7128, -74.006, 100, 'home');

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.name).toBe('Home');
        expect(callBody.centerLatitude).toBe(40.7128);
        expect(callBody.centerLongitude).toBe(-74.006);
        expect(callBody.radius).toBe(100);
        expect(callBody.type).toBe('home');
      });
    });

    describe('update', () => {
      it('should update safe zone', async () => {
        const updates = { name: 'Updated Home', radius: 150 };
        await apiClient.safeZones.update('zone-123', updates);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/safe-zones/zone-123'),
          expect.objectContaining({ method: 'PUT' })
        );
      });
    });

    describe('delete', () => {
      it('should delete safe zone', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse(undefined),
        });

        await apiClient.safeZones.delete('zone-123');

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/safe-zones/zone-123'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    describe('checkGeofence', () => {
      it('should check if location is in safe zone', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse({
            insideSafeZone: true,
            safeZone: mockSafeZone,
          }),
        });

        const response = await apiClient.safeZones.checkGeofence(40.7128, -74.006);

        expect(response.success).toBe(true);
        expect(response.data?.insideSafeZone).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/safe-zones/check?latitude=40.7128&longitude=-74.006'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Emergency API', () => {
    const mockContact: EmergencyContact = {
      id: 'contact-123',
      userId: 'user-123',
      name: 'John Doe',
      phoneNumber: '+1234567890',
      email: 'john@example.com',
      relationship: 'Father',
      createdAt: '2025-01-01T00:00:00Z',
    };

    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse(mockContact),
      });
    });

    describe('listContacts', () => {
      it('should fetch all emergency contacts', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse([mockContact]),
        });

        const response = await apiClient.emergency.listContacts();

        expect(response.success).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/emergency-contacts'),
          expect.any(Object)
        );
      });
    });

    describe('addContact', () => {
      it('should add emergency contact', async () => {
        await apiClient.emergency.addContact('John Doe', '+1234567890', 'john@example.com', 'Father');

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.name).toBe('John Doe');
        expect(callBody.phoneNumber).toBe('+1234567890');
        expect(callBody.email).toBe('john@example.com');
        expect(callBody.relationship).toBe('Father');
      });
    });

    describe('updateContact', () => {
      it('should update emergency contact', async () => {
        const updates = { phoneNumber: '+9876543210' };
        await apiClient.emergency.updateContact('contact-123', updates);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/emergency-contacts/contact-123'),
          expect.objectContaining({ method: 'PUT' })
        );
      });
    });

    describe('deleteContact', () => {
      it('should delete emergency contact', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse(undefined),
        });

        await apiClient.emergency.deleteContact('contact-123');

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/emergency-contacts/contact-123'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    describe('triggerAlert', () => {
      it('should trigger emergency alert', async () => {
        const mockAlert = {
          id: 'alert-123',
          userId: 'user-123',
          triggerReason: 'Manual trigger',
          locationSnapshot: {
            latitude: 40.7128,
            longitude: -74.006,
            timestamp: '2025-01-01T00:00:00Z',
          },
          sentAt: '2025-01-01T00:00:00Z',
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse(mockAlert),
        });

        const response = await apiClient.emergency.triggerAlert();

        expect(response.success).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/emergency/alert'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });
  });

  describe('Offline Sync API', () => {
    it('should sync offline actions', async () => {
      const actions = [
        {
          id: 'action-1',
          actionType: 'location_update' as const,
          data: { latitude: 40.7128, longitude: -74.006 },
          createdAt: Date.now(),
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse({ syncedCount: 1 }),
      });

      const response = await apiClient.offline.syncActions(actions);

      expect(response.success).toBe(true);
      expect(response.data?.syncedCount).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/offline-actions/sync'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Health Check', () => {
    it('should perform health check without auth', async () => {
      const mockHealth = {
        status: 'healthy',
        services: { database: 'connected', redis: 'connected' },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse(mockHealth),
      });

      const response = await apiClient.healthCheck();

      expect(response.success).toBe(true);
      expect(response.data?.status).toBe('healthy');

      // Should not include auth header
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].headers.Authorization).toBeUndefined();
    });
  });

  describe('Token Refresh (internal)', () => {
    it('should prevent concurrent refresh attempts', async () => {
      apiClient['refreshToken'] = mockRefreshToken;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse({ tokens: mockTokens }),
      });

      // Trigger multiple refresh attempts simultaneously
      const refresh1 = apiClient['refreshAccessToken']();
      const refresh2 = apiClient['refreshAccessToken']();
      const refresh3 = apiClient['refreshAccessToken']();

      const results = await Promise.all([refresh1, refresh2, refresh3]);

      // Should only call the API once
      expect(global.fetch).toHaveBeenCalledTimes(1);
      // All promises should resolve to same result
      expect(results).toEqual([true, true, true]);
    });

    it('should clear refresh promise after completion', async () => {
      apiClient['refreshToken'] = mockRefreshToken;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse({ tokens: mockTokens }),
      });

      await apiClient['refreshAccessToken']();

      expect(apiClient['refreshPromise']).toBeNull();
    });
  });
});
