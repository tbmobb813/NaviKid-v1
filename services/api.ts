/**
 * NaviKid Backend API Client
 *
 * Comprehensive TypeScript API client for NaviKid backend integration.
 * Handles authentication, locations, safe zones, emergency contacts, and offline sync.
 */

import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { log } from '@/utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: Date;
    requestId?: string;
  };
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  role: 'parent' | 'guardian';
  createdAt: string;
}

export interface Location {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  context?: LocationContext;
}

export interface LocationContext {
  batteryLevel?: number;
  isMoving?: boolean;
  speed?: number;
  altitude?: number;
  heading?: number;
}

export interface SafeZone {
  id: string;
  userId: string;
  name: string;
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  type: 'home' | 'school' | 'friend' | 'custom';
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  email: string;
  relationship: string;
  createdAt: string;
}

export interface EmergencyAlert {
  id: string;
  userId: string;
  triggerReason: string;
  locationSnapshot: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  sentAt: string;
}

export interface OfflineAction {
  id: string;
  actionType: 'location_update' | 'safe_zone_check' | 'emergency_alert';
  data: any;
  createdAt: number;
}

// ============================================================================
// API Client Class
// ============================================================================

class NaviKidApiClient {
  private config: ApiConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config?: Partial<ApiConfig>) {
    // Get config from expo constants or defaults
    const extra = Constants.expoConfig?.extra;

    this.config = {
      baseUrl: config?.baseUrl || extra?.api?.baseUrl || 'http://localhost:3000',
      timeout: config?.timeout || extra?.api?.timeout || 15000,
      retryAttempts: config?.retryAttempts || 3,
      retryDelay: config?.retryDelay || 1000,
    };

    log.info('API Client initialized', { baseUrl: this.config.baseUrl });
    this.loadTokens();
  }

  // ==========================================================================
  // Token Management
  // ==========================================================================

  private async loadTokens(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage on web
        this.accessToken = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
      } else {
        // Use SecureStore on native
        this.accessToken = await SecureStore.getItemAsync('access_token');
        this.refreshToken = await SecureStore.getItemAsync('refresh_token');
      }

      if (this.accessToken) {
        log.debug('Loaded auth tokens from storage');
      }
    } catch (error) {
      log.error('Failed to load tokens', error as Error);
    }
  }

  private async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;

      if (Platform.OS === 'web') {
        localStorage.setItem('access_token', tokens.accessToken);
        localStorage.setItem('refresh_token', tokens.refreshToken);
      } else {
        await SecureStore.setItemAsync('access_token', tokens.accessToken);
        await SecureStore.setItemAsync('refresh_token', tokens.refreshToken);
      }

      log.debug('Saved auth tokens to storage');
    } catch (error) {
      log.error('Failed to save tokens', error as Error);
      throw error;
    }
  }

  private async clearTokens(): Promise<void> {
    try {
      this.accessToken = null;
      this.refreshToken = null;

      if (Platform.OS === 'web') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } else {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }

      log.debug('Cleared auth tokens');
    } catch (error) {
      log.error('Failed to clear tokens', error as Error);
    }
  }

  setAuthToken(token: string): void {
    this.accessToken = token;
  }

  clearAuthToken(): void {
    this.accessToken = null;
  }

  // ==========================================================================
  // HTTP Request Methods
  // ==========================================================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipAuth: boolean = false,
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available and not skipped
    if (!skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      log.debug('API Request', { method: options.method || 'GET', endpoint });

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      // Handle 401 - Unauthorized (token expired)
      if (response.status === 401 && !skipAuth && endpoint !== '/auth/refresh') {
        log.warn('Token expired, attempting refresh');

        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request with new token
          return this.request<T>(endpoint, options, skipAuth);
        } else {
          // Refresh failed, clear tokens and throw
          await this.clearTokens();
          throw new Error('Session expired. Please login again.');
        }
      }

      // Handle other error status codes
      if (!response.ok) {
        const error = data.error || { message: `HTTP ${response.status}` };
        log.error('API Error', new Error(error.message));
        throw new Error(error.message);
      }

      log.debug('API Response', { success: data.success, endpoint });
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }

      throw new Error('Unknown error occurred');
    }
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    skipAuth: boolean = false,
  ): Promise<ApiResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        return await this.request<T>(endpoint, options, skipAuth);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on auth errors or client errors (4xx)
        if (
          error instanceof Error &&
          (error.message.includes('401') ||
            error.message.includes('403') ||
            error.message.includes('400'))
        ) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retryAttempts - 1) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          log.debug(`Retrying request in ${delay}ms (attempt ${attempt + 1}/${this.config.retryAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  // ==========================================================================
  // Public HTTP Methods
  // ==========================================================================

  async get<T>(endpoint: string, skipAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, { method: 'GET' }, skipAuth);
  }

  async post<T>(endpoint: string, data?: any, skipAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      skipAuth,
    );
  }

  async put<T>(endpoint: string, data?: any, skipAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      skipAuth,
    );
  }

  async delete<T>(endpoint: string, skipAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, { method: 'DELETE' }, skipAuth);
  }

  async patch<T>(endpoint: string, data?: any, skipAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      skipAuth,
    );
  }

  // ==========================================================================
  // Authentication API
  // ==========================================================================

  auth = {
    register: async (email: string, password: string, role: 'parent' | 'guardian' = 'parent'): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
      const response = await this.request<{ user: User; tokens: AuthTokens }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, role }),
        },
        true, // Skip auth for registration
      );

      if (response.success && response.data) {
        await this.saveTokens(response.data.tokens);
      }

      return response;
    },

    login: async (email: string, password: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
      const response = await this.request<{ user: User; tokens: AuthTokens }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
        true, // Skip auth for login
      );

      if (response.success && response.data) {
        await this.saveTokens(response.data.tokens);
      }

      return response;
    },

    logout: async (): Promise<ApiResponse<void>> => {
      const response = await this.request<void>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      await this.clearTokens();
      return response;
    },

    refreshToken: async (): Promise<ApiResponse<{ tokens: AuthTokens }>> => {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.request<{ tokens: AuthTokens }>(
        '/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        },
        true, // Skip auth for token refresh
      );

      if (response.success && response.data) {
        await this.saveTokens(response.data.tokens);
      }

      return response;
    },

    me: async (): Promise<ApiResponse<{ user: User }>> => {
      return this.request<{ user: User }>('/auth/me');
    },

    changePassword: async (oldPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
      return this.request<void>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
    },
  };

  // ==========================================================================
  // Locations API
  // ==========================================================================

  locations = {
    sendLocation: async (
      latitude: number,
      longitude: number,
      accuracy: number,
      context?: LocationContext,
    ): Promise<ApiResponse<Location>> => {
      return this.requestWithRetry<Location>('/locations', {
        method: 'POST',
        body: JSON.stringify({
          latitude,
          longitude,
          accuracy,
          context: context || {},
        }),
      });
    },

    getHistory: async (startDate?: string, endDate?: string): Promise<ApiResponse<Location[]>> => {
      let endpoint = '/locations/history';
      const params = new URLSearchParams();

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      return this.request<Location[]>(endpoint);
    },

    getCurrent: async (): Promise<ApiResponse<Location>> => {
      return this.request<Location>('/locations/current');
    },

    delete: async (locationId: string): Promise<ApiResponse<void>> => {
      return this.request<void>(`/locations/${locationId}`, {
        method: 'DELETE',
      });
    },
  };

  // ==========================================================================
  // Safe Zones API
  // ==========================================================================

  safeZones = {
    list: async (): Promise<ApiResponse<SafeZone[]>> => {
      return this.request<SafeZone[]>('/safe-zones');
    },

    create: async (
      name: string,
      centerLat: number,
      centerLon: number,
      radius: number,
      type: 'home' | 'school' | 'friend' | 'custom',
    ): Promise<ApiResponse<SafeZone>> => {
      return this.request<SafeZone>('/safe-zones', {
        method: 'POST',
        body: JSON.stringify({
          name,
          centerLatitude: centerLat,
          centerLongitude: centerLon,
          radius,
          type,
        }),
      });
    },

    update: async (id: string, updates: Partial<SafeZone>): Promise<ApiResponse<SafeZone>> => {
      return this.request<SafeZone>(`/safe-zones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    delete: async (id: string): Promise<ApiResponse<void>> => {
      return this.request<void>(`/safe-zones/${id}`, {
        method: 'DELETE',
      });
    },

    checkGeofence: async (latitude: number, longitude: number): Promise<ApiResponse<{ insideSafeZone: boolean; safeZone?: SafeZone }>> => {
      return this.request<{ insideSafeZone: boolean; safeZone?: SafeZone }>(
        `/safe-zones/check?latitude=${latitude}&longitude=${longitude}`,
      );
    },
  };

  // ==========================================================================
  // Emergency Contacts API
  // ==========================================================================

  emergency = {
    listContacts: async (): Promise<ApiResponse<EmergencyContact[]>> => {
      return this.request<EmergencyContact[]>('/emergency-contacts');
    },

    addContact: async (
      name: string,
      phone: string,
      email: string,
      relationship: string,
    ): Promise<ApiResponse<EmergencyContact>> => {
      return this.request<EmergencyContact>('/emergency-contacts', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phoneNumber: phone,
          email,
          relationship,
        }),
      });
    },

    updateContact: async (id: string, updates: Partial<EmergencyContact>): Promise<ApiResponse<EmergencyContact>> => {
      return this.request<EmergencyContact>(`/emergency-contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    deleteContact: async (id: string): Promise<ApiResponse<void>> => {
      return this.request<void>(`/emergency-contacts/${id}`, {
        method: 'DELETE',
      });
    },

    triggerAlert: async (): Promise<ApiResponse<EmergencyAlert>> => {
      return this.request<EmergencyAlert>('/emergency/alert', {
        method: 'POST',
      });
    },
  };

  // ==========================================================================
  // Offline Sync API
  // ==========================================================================

  offline = {
    syncActions: async (actions: OfflineAction[]): Promise<ApiResponse<{ syncedCount: number }>> => {
      return this.request<{ syncedCount: number }>('/offline-actions/sync', {
        method: 'POST',
        body: JSON.stringify({ actions }),
      });
    },
  };

  // ==========================================================================
  // Token Refresh (internal)
  // ==========================================================================

  private async refreshAccessToken(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await this.auth.refreshToken();
        return response.success;
      } catch (error) {
        log.error('Token refresh failed', error as Error);
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ==========================================================================
  // Health Check
  // ==========================================================================

  async healthCheck(): Promise<ApiResponse<{ status: string; services: any }>> {
    return this.request<{ status: string; services: any }>('/health', {}, true);
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const apiClient = new NaviKidApiClient();
export default apiClient;
