import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import {
  SafeZone,
  CheckInRequest,
  ParentalSettings,
  EmergencyContact,
  ParentDashboardData,
  DevicePingRequest,
} from '@/types/parental';

const DEFAULT_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'emergency_911',
    name: 'Emergency Services',
    phone: '911',
    relationship: 'Emergency',
    isPrimary: false,
    canReceiveAlerts: false,
  },
];

const DEFAULT_SETTINGS: ParentalSettings = {
  requirePinForParentMode: true,
  parentPin: undefined,
  allowChildCategoryCreation: true,
  requireApprovalForCategories: true,
  maxCustomCategories: 20,
  safeZoneAlerts: true,
  checkInReminders: true,
  emergencyContacts: DEFAULT_EMERGENCY_CONTACTS,
};

const STORAGE_KEYS = {
  SETTINGS: 'kidmap_parental_settings',
  SAFE_ZONES: 'kidmap_safe_zones',
  CHECK_IN_REQUESTS: 'kidmap_check_in_requests',
  DASHBOARD_DATA: 'kidmap_dashboard_data',
  DEVICE_PINGS: 'kidmap_device_pings',
  PIN_HASH: 'kidmap_pin_hash', // Stored in SecureStore
  PIN_SALT: 'kidmap_pin_salt', // Stored in SecureStore
  AUTH_ATTEMPTS: 'kidmap_auth_attempts', // Track failed attempts
};

// Security configuration
const SECURITY_CONFIG = {
  MAX_AUTH_ATTEMPTS: 5, // Maximum failed attempts before lockout
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
  SALT_LENGTH: 32, // Length of cryptographic salt
};

export const [ParentalProvider, useParentalStore] = createContextHook(() => {
  const [settings, setSettings] = useState<ParentalSettings>(DEFAULT_SETTINGS);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [checkInRequests, setCheckInRequests] = useState<CheckInRequest[]>([]);
  const [dashboardData, setDashboardData] = useState<ParentDashboardData>({
    recentCheckIns: [],
    pendingCategoryApprovals: [],
    safeZoneActivity: [],
  });
  const [devicePings, setDevicePings] = useState<DevicePingRequest[]>([]);
  const [isParentMode, setIsParentMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Security state for rate limiting and session management
  const [authAttempts, setAuthAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          storedSettings,
          storedSafeZones,
          storedCheckInRequests,
          storedDashboardData,
          storedDevicePings,
          storedAuthAttempts,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.SAFE_ZONES),
          AsyncStorage.getItem(STORAGE_KEYS.CHECK_IN_REQUESTS),
          AsyncStorage.getItem(STORAGE_KEYS.DASHBOARD_DATA),
          AsyncStorage.getItem(STORAGE_KEYS.DEVICE_PINGS),
          AsyncStorage.getItem(STORAGE_KEYS.AUTH_ATTEMPTS),
        ]);

        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
        if (storedSafeZones) {
          setSafeZones(JSON.parse(storedSafeZones));
        }
        if (storedCheckInRequests) {
          setCheckInRequests(JSON.parse(storedCheckInRequests));
        }
        if (storedDashboardData) {
          setDashboardData(JSON.parse(storedDashboardData));
        }
        if (storedDevicePings) {
          setDevicePings(JSON.parse(storedDevicePings));
        }
        if (storedAuthAttempts) {
          const attempts = JSON.parse(storedAuthAttempts);
          setAuthAttempts(attempts.count || 0);
          // Check if still in lockout period from previous session
          const timeSinceLastAttempt = Date.now() - (attempts.timestamp || 0);
          if (attempts.count >= SECURITY_CONFIG.MAX_AUTH_ATTEMPTS &&
              timeSinceLastAttempt < SECURITY_CONFIG.LOCKOUT_DURATION) {
            setLockoutUntil(attempts.timestamp + SECURITY_CONFIG.LOCKOUT_DURATION);
          }
        }
      } catch (error) {
        console.error('Failed to load parental data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Cleanup session timeout on unmount
  useEffect(() => {
    return () => {
      clearSessionTimeout();
    };
  }, []);

  // Save functions
  const saveSettings = async (newSettings: ParentalSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const saveSafeZones = async (newSafeZones: SafeZone[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SAFE_ZONES, JSON.stringify(newSafeZones));
      setSafeZones(newSafeZones);
    } catch (error) {
      console.error('Failed to save safe zones:', error);
    }
  };

  const saveCheckInRequests = async (newRequests: CheckInRequest[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHECK_IN_REQUESTS, JSON.stringify(newRequests));
      setCheckInRequests(newRequests);
    } catch (error) {
      console.error('Failed to save check-in requests:', error);
    }
  };

  const saveDashboardData = async (newData: ParentDashboardData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DASHBOARD_DATA, JSON.stringify(newData));
      setDashboardData(newData);
    } catch (error) {
      console.error('Failed to save dashboard data:', error);
    }
  };

  const saveDevicePings = async (newPings: DevicePingRequest[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_PINGS, JSON.stringify(newPings));
      setDevicePings(newPings);
    } catch (error) {
      console.error('Failed to save device pings:', error);
    }
  };

  // Security helper functions
  const generateSalt = async (): Promise<string> => {
    const randomBytes = await Crypto.getRandomBytesAsync(SECURITY_CONFIG.SALT_LENGTH);
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const hashPinWithSalt = async (pin: string, salt: string): Promise<string> => {
    const combined = pin + salt;
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );
  };

  const clearSessionTimeout = () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  };

  const startSessionTimeout = () => {
    clearSessionTimeout();
    sessionTimeoutRef.current = setTimeout(() => {
      exitParentMode();
      console.log('[Security] Parent mode session expired after 30 minutes');
    }, SECURITY_CONFIG.SESSION_TIMEOUT);
  };

  // Parent mode authentication with security
  const authenticateParentMode = async (pin: string): Promise<boolean> => {
    try {
      // Check if PIN is required
      if (!settings.requirePinForParentMode) {
        setIsParentMode(true);
        startSessionTimeout();
        return true;
      }

      // Check if currently in lockout period
      if (lockoutUntil && Date.now() < lockoutUntil) {
        const remainingMinutes = Math.ceil((lockoutUntil - Date.now()) / 60000);
        throw new Error(`Too many failed attempts. Please try again in ${remainingMinutes} minute(s).`);
      }

      // Get stored PIN hash and salt from SecureStore
      const storedHash = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_HASH);
      const storedSalt = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_SALT);

      // If no PIN is set, allow access (first-time setup)
      if (!storedHash || !storedSalt) {
        console.warn('[Security] No PIN configured - allowing access for initial setup');
        setIsParentMode(true);
        startSessionTimeout();
        return true;
      }

      // Hash the input PIN with the stored salt
      const inputHash = await hashPinWithSalt(pin, storedSalt);

      // Compare hashes
      if (inputHash === storedHash) {
        // Successful authentication
        setAuthAttempts(0);
        setLockoutUntil(null);
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_ATTEMPTS);
        setIsParentMode(true);
        startSessionTimeout();
        console.log('[Security] Parent mode authenticated successfully');
        return true;
      }

      // Failed authentication - increment attempts
      const newAttempts = authAttempts + 1;
      setAuthAttempts(newAttempts);
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_ATTEMPTS, JSON.stringify({
        count: newAttempts,
        timestamp: Date.now(),
      }));

      // Check if lockout threshold reached
      if (newAttempts >= SECURITY_CONFIG.MAX_AUTH_ATTEMPTS) {
        const lockoutTime = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION;
        setLockoutUntil(lockoutTime);
        setAuthAttempts(0);
        console.warn('[Security] Maximum authentication attempts exceeded - account locked');
        throw new Error(`Too many failed attempts. Account locked for ${SECURITY_CONFIG.LOCKOUT_DURATION / 60000} minutes.`);
      }

      const remainingAttempts = SECURITY_CONFIG.MAX_AUTH_ATTEMPTS - newAttempts;
      console.warn(`[Security] Authentication failed. ${remainingAttempts} attempt(s) remaining.`);

      return false;
    } catch (error) {
      console.error('[Security] Authentication error:', error);
      throw error;
    }
  };

  const exitParentMode = () => {
    clearSessionTimeout();
    setIsParentMode(false);
    console.log('[Security] Exited parent mode');
  };

  const setParentPin = async (pin: string) => {
    try {
      // Validate PIN (should be 4-6 digits)
      if (!/^\d{4,6}$/.test(pin)) {
        throw new Error('PIN must be 4-6 digits');
      }

      // Generate new salt
      const salt = await generateSalt();

      // Hash the PIN with the salt
      const hash = await hashPinWithSalt(pin, salt);

      // Store hash and salt in SecureStore (encrypted storage)
      await SecureStore.setItemAsync(STORAGE_KEYS.PIN_HASH, hash);
      await SecureStore.setItemAsync(STORAGE_KEYS.PIN_SALT, salt);

      // Remove plain text PIN from settings if it exists
      const newSettings = { ...settings };
      delete (newSettings as any).parentPin;
      await saveSettings(newSettings);

      // Reset authentication attempts
      setAuthAttempts(0);
      setLockoutUntil(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_ATTEMPTS);

      console.log('[Security] PIN updated successfully with secure hashing');
    } catch (error) {
      console.error('[Security] Failed to set PIN:', error);
      throw error;
    }
  };

  // Safe zone management
  const addSafeZone = async (safeZone: Omit<SafeZone, 'id' | 'createdAt'>) => {
    const newSafeZone: SafeZone = {
      ...safeZone,
      id: `safe_zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };

    const updatedSafeZones = [...safeZones, newSafeZone];
    await saveSafeZones(updatedSafeZones);
    return newSafeZone;
  };

  const updateSafeZone = async (id: string, updates: Partial<SafeZone>) => {
    const updatedSafeZones = safeZones.map((zone) =>
      zone.id === id ? { ...zone, ...updates } : zone,
    );
    await saveSafeZones(updatedSafeZones);
  };

  const deleteSafeZone = async (id: string) => {
    const updatedSafeZones = safeZones.filter((zone) => zone.id !== id);
    await saveSafeZones(updatedSafeZones);
  };

  // Check-in request management
  const requestCheckIn = async (message: string, isUrgent: boolean = false) => {
    const newRequest: CheckInRequest = {
      id: `check_in_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      childId: 'current_child', // In a real app, this would be the actual child ID
      requestedAt: Date.now(),
      message,
      isUrgent,
      status: 'pending',
    };

    const updatedRequests = [...checkInRequests, newRequest];
    await saveCheckInRequests(updatedRequests);
    return newRequest;
  };

  const completeCheckIn = async (
    requestId: string,
    location?: { latitude: number; longitude: number; placeName?: string },
  ) => {
    const updatedRequests = checkInRequests.map((request) =>
      request.id === requestId
        ? { ...request, status: 'completed' as const, completedAt: Date.now(), location }
        : request,
    );
    await saveCheckInRequests(updatedRequests);
  };

  // Emergency contact management
  const addEmergencyContact = async (contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedContacts = [...settings.emergencyContacts, newContact];
    const newSettings = { ...settings, emergencyContacts: updatedContacts };
    await saveSettings(newSettings);
    return newContact;
  };

  const updateEmergencyContact = async (id: string, updates: Partial<EmergencyContact>) => {
    const updatedContacts = settings.emergencyContacts.map((contact) =>
      contact.id === id ? { ...contact, ...updates } : contact,
    );
    const newSettings = { ...settings, emergencyContacts: updatedContacts };
    await saveSettings(newSettings);
  };

  const deleteEmergencyContact = async (id: string) => {
    const updatedContacts = settings.emergencyContacts.filter((contact) => contact.id !== id);
    const newSettings = { ...settings, emergencyContacts: updatedContacts };
    await saveSettings(newSettings);
  };

  // Device ping management
  const sendDevicePing = async (type: DevicePingRequest['type'], message?: string) => {
    const newPing: DevicePingRequest = {
      id: `ping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      requestedAt: Date.now(),
      status: 'pending',
    };

    const updatedPings = [...devicePings, newPing];
    await saveDevicePings(updatedPings);
    return newPing;
  };

  const acknowledgePing = async (
    pingId: string,
    location?: { latitude: number; longitude: number },
  ) => {
    const updatedPings = devicePings.map((ping) =>
      ping.id === pingId
        ? {
            ...ping,
            status: 'acknowledged' as const,
            response: {
              timestamp: Date.now(),
              location,
            },
          }
        : ping,
    );
    await saveDevicePings(updatedPings);
  };

  // Dashboard data management
  const addCheckInToDashboard = (checkIn: ParentDashboardData['recentCheckIns'][0]) => {
    const updatedData = {
      ...dashboardData,
      recentCheckIns: [checkIn, ...dashboardData.recentCheckIns].slice(0, 10), // Keep last 10
    };
    saveDashboardData(updatedData);
  };

  const updateLastKnownLocation = (
    location: NonNullable<ParentDashboardData['lastKnownLocation']>,
  ) => {
    const updatedData = {
      ...dashboardData,
      lastKnownLocation: location,
    };
    saveDashboardData(updatedData);
  };

  return {
    // State
    settings,
    safeZones,
    checkInRequests,
    dashboardData,
    devicePings,
    isParentMode,
    isLoading,

    // Authentication
    authenticateParentMode,
    exitParentMode,
    setParentPin,

    // Settings
    saveSettings,

    // Safe zones
    addSafeZone,
    updateSafeZone,
    deleteSafeZone,

    // Check-ins
    requestCheckIn,
    completeCheckIn,

    // Emergency contacts
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,

    // Device pings
    sendDevicePing,
    acknowledgePing,

    // Dashboard
    addCheckInToDashboard,
    updateLastKnownLocation,
    saveDashboardData,
  };
});
