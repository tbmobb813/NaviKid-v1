import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mainStorage } from '@/utils/storage';
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
import { logger } from '@/utils/logger';

// Instrumentation: incremental instance id to trace provider mounts in tests
let __parentalProviderInstanceCounter = 0;

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
  // Keep loading=true until async initialization completes so tests can wait
  // for `isLoading === false` only after the real hydration finished.
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Security state for rate limiting and session management
  const [authAttempts, setAuthAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const activeOpsRef = useRef(0);
  const bumpActive = () => {
    activeOpsRef.current += 1;
    logger.debug('[TestDebug] parentalStore activeOps increment', { activeOps: activeOpsRef.current, instanceId: (isMountedRef as any).instanceId });
  };
  const dropActive = () => {
    activeOpsRef.current = Math.max(0, activeOpsRef.current - 1);
    logger.debug('[TestDebug] parentalStore activeOps decrement', { activeOps: activeOpsRef.current, instanceId: (isMountedRef as any).instanceId });
  };
  const applyIfMounted = (fn: () => void) => {
    if (isMountedRef.current) fn();
  };

  // Load data from storage
  useEffect(() => {
    // Track mounted state to avoid calling setState on unmounted component
    isMountedRef.current = true;
    const instanceId = ++__parentalProviderInstanceCounter;
    // store instance id for this hook instance
    (isMountedRef as any).instanceId = instanceId;
    logger.debug('[TestDebug] parentalStore mounted', { instanceId });

    const loadData = async () => {
      bumpActive();
      logger.debug('[TestDebug] parentalStore.loadData start', { instanceId, activeOps: activeOpsRef.current });
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
          applyIfMounted(() => setSettings(JSON.parse(storedSettings)));
        }
        if (storedSafeZones) {
          applyIfMounted(() => setSafeZones(JSON.parse(storedSafeZones)));
        }
        if (storedCheckInRequests) {
          applyIfMounted(() => setCheckInRequests(JSON.parse(storedCheckInRequests)));
        }
        if (storedDashboardData) {
          applyIfMounted(() => setDashboardData(JSON.parse(storedDashboardData)));
        }
        if (storedDevicePings) {
          applyIfMounted(() => setDevicePings(JSON.parse(storedDevicePings)));
        }
        // Read attempts from the new mainStorage (synchronous API). If migration
        // hasn't run, fall back to AsyncStorage (handled above) — tests mock mainStorage.
        const storedAttempts = mainStorage.get(STORAGE_KEYS.AUTH_ATTEMPTS) as any;
        if (storedAttempts) {
          applyIfMounted(() => setAuthAttempts(storedAttempts.count || 0));
          const timeSinceLastAttempt = Date.now() - (storedAttempts.timestamp || 0);
          if (
            storedAttempts.count >= SECURITY_CONFIG.MAX_AUTH_ATTEMPTS &&
            timeSinceLastAttempt < SECURITY_CONFIG.LOCKOUT_DURATION
          ) {
            applyIfMounted(() => setLockoutUntil((storedAttempts.timestamp || 0) + SECURITY_CONFIG.LOCKOUT_DURATION));
          }
        } else if (storedAuthAttempts) {
          try {
            const attempts = JSON.parse(storedAuthAttempts);
            applyIfMounted(() => setAuthAttempts(attempts.count || 0));
            const timeSinceLastAttempt = Date.now() - (attempts.timestamp || 0);
            if (
              attempts.count >= SECURITY_CONFIG.MAX_AUTH_ATTEMPTS &&
              timeSinceLastAttempt < SECURITY_CONFIG.LOCKOUT_DURATION
            ) {
              applyIfMounted(() => setLockoutUntil((attempts.timestamp || 0) + SECURITY_CONFIG.LOCKOUT_DURATION));
            }
          } catch (e) {
            // Ignore parse errors; we'll start fresh
            applyIfMounted(() => setAuthAttempts(0));
          }
        }
      } catch (error) {
        logger.error('Failed to load parental data:', error as Error);
      } finally {
        dropActive();
        logger.debug('[TestDebug] parentalStore.loadData end', { instanceId, activeOps: activeOpsRef.current });
        applyIfMounted(() => setIsLoading(false));
      }
    };

    loadData();

    return () => {
      // mark unmounted to prevent later state updates
      const instanceId = (isMountedRef as any).instanceId;
      if (activeOpsRef.current > 0) {
        logger.warn('[TestDebug] parentalStore unmounted with active operations', {
          instanceId,
          activeOps: activeOpsRef.current,
        });
      }
      isMountedRef.current = false;
      logger.debug('[TestDebug] parentalStore unmounted', { instanceId });
    };
  }, []);

  // Cleanup session timeout on unmount
  useEffect(() => {
    return () => {
      clearSessionTimeout();
    };
  }, []);

  // Save functions
  const saveSettings = async (newSettings: ParentalSettings) => {
    bumpActive();
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      applyIfMounted(() => setSettings(newSettings));
    } catch (error) {
      logger.error('Failed to save settings:', error as Error);
    }
    dropActive();
  };

  const saveSafeZones = async (newSafeZones: SafeZone[]) => {
    bumpActive();
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SAFE_ZONES, JSON.stringify(newSafeZones));
      applyIfMounted(() => setSafeZones(newSafeZones));
    } catch (error) {
      logger.error('Failed to save safe zones:', error as Error);
    }
    dropActive();
  };

  const saveCheckInRequests = async (newRequests: CheckInRequest[]) => {
    bumpActive();
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHECK_IN_REQUESTS, JSON.stringify(newRequests));
      applyIfMounted(() => setCheckInRequests(newRequests));
    } catch (error) {
      logger.error('Failed to save check-in requests:', error as Error);
    }
    dropActive();
  };

  const saveDashboardData = async (newData: ParentDashboardData) => {
    bumpActive();
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DASHBOARD_DATA, JSON.stringify(newData));
      applyIfMounted(() => setDashboardData(newData));
    } catch (error) {
      logger.error('Failed to save dashboard data:', error as Error);
    }
    dropActive();
  };

  const saveDevicePings = async (newPings: DevicePingRequest[]) => {
    bumpActive();
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_PINGS, JSON.stringify(newPings));
      applyIfMounted(() => setDevicePings(newPings));
    } catch (error) {
      logger.error('Failed to save device pings:', error as Error);
    }
    dropActive();
  };

  // Security helper functions
  const generateSalt = async (): Promise<string> => {
    const randomBytes = await Crypto.getRandomBytesAsync(SECURITY_CONFIG.SALT_LENGTH);
    return Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const hashPinWithSalt = async (pin: string, salt: string): Promise<string> => {
    const combined = pin + salt;
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);
  };

  const clearSessionTimeout = () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
      logger.debug('[TestDebug] cleared session timeout');
    } else {
      logger.debug('[TestDebug] clearSessionTimeout called, no active timeout');
    }
  };

  const startSessionTimeout = () => {
    clearSessionTimeout();
    // Avoid scheduling long-running timeouts during unit tests to prevent
    // lingering timers and overlapping act() warnings. Tests don't need a
    // real session timeout.
    if (typeof jest !== 'undefined') {
      logger.debug('[TestDebug] startSessionTimeout skipped in test environment');
      return;
    }

    logger.debug('[TestDebug] scheduling session timeout', { timeoutMs: SECURITY_CONFIG.SESSION_TIMEOUT });
    sessionTimeoutRef.current = setTimeout(() => {
      exitParentMode();
      logger.info('[Security] Parent mode session expired after 30 minutes');
    }, SECURITY_CONFIG.SESSION_TIMEOUT);
  };

  // Parent mode authentication with security
  const authenticateParentMode = async (pin: string): Promise<boolean> => {
    bumpActive();
    try {
      // Check if PIN is required
      if (!settings.requirePinForParentMode) {
        applyIfMounted(() => setIsParentMode(true));
        startSessionTimeout();
        return true;
      }

      // Check lockout status from AsyncStorage (more reliable than state)
      const storedAttempts = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_ATTEMPTS);
      if (storedAttempts) {
        try {
          const attempts = JSON.parse(storedAttempts);
          const timeSinceLastAttempt = Date.now() - (attempts.timestamp || 0);
          if (
            attempts.count >= SECURITY_CONFIG.MAX_AUTH_ATTEMPTS &&
            timeSinceLastAttempt < SECURITY_CONFIG.LOCKOUT_DURATION
          ) {
            const lockoutRemaining = SECURITY_CONFIG.LOCKOUT_DURATION - timeSinceLastAttempt;
            const remainingMinutes = Math.ceil(lockoutRemaining / 60000);
            throw new Error(
              `Too many failed attempts. Please try again in ${remainingMinutes} minute(s).`,
            );
          }
        } catch (parseError) {
          // Handle corrupted stored attempts data
          logger.warn('[Security] Corrupted auth attempts data detected, clearing and continuing:', parseError);
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_ATTEMPTS);
          applyIfMounted(() => setAuthAttempts(0));
          applyIfMounted(() => setLockoutUntil(null));
        }
      }

      // Check if currently in lockout period (from state)
      if (lockoutUntil && Date.now() < lockoutUntil) {
        const remainingMinutes = Math.ceil((lockoutUntil - Date.now()) / 60000);
        throw new Error(
          `Too many failed attempts. Please try again in ${remainingMinutes} minute(s).`,
        );
      }

      // Get stored PIN hash and salt from SecureStore
      const storedHash = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_HASH);
      const storedSalt = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_SALT);

      // If no PIN is set, allow access (first-time setup)
      if (!storedHash || !storedSalt) {
        logger.warn('[Security] No PIN configured - allowing access for initial setup');
        applyIfMounted(() => setIsParentMode(true));
        startSessionTimeout();
        return true;
      }

      // Hash the input PIN with the stored salt
      const inputHash = await hashPinWithSalt(pin, storedSalt);

      // Compare hashes
      if (inputHash === storedHash) {
        // Successful authentication
        applyIfMounted(() => setAuthAttempts(0));
        applyIfMounted(() => setLockoutUntil(null));
        try {
          mainStorage.delete(STORAGE_KEYS.AUTH_ATTEMPTS);
        } catch (e) {
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_ATTEMPTS);
        }
        applyIfMounted(() => setIsParentMode(true));
        startSessionTimeout();
        logger.info('[Security] Parent mode authenticated successfully');
        return true;
      }

      // Failed authentication - increment attempts (persist to mainStorage)
      const newAttempts = authAttempts + 1;
      applyIfMounted(() => setAuthAttempts(newAttempts));
      try {
        mainStorage.set(STORAGE_KEYS.AUTH_ATTEMPTS, {
          count: newAttempts,
          timestamp: Date.now(),
        });
      } catch (storageError) {
        logger.error('[Security] Failed to persist auth attempts to storage:', storageError as Error);
        // Fall back to AsyncStorage if mainStorage fails for any reason
        try {
          await AsyncStorage.setItem(
            STORAGE_KEYS.AUTH_ATTEMPTS,
            JSON.stringify({
              count: newAttempts,
              timestamp: Date.now(),
            }),
          );
        } catch (e) {
          // swallow
        }
      }

      // Check if lockout threshold reached
      if (newAttempts >= SECURITY_CONFIG.MAX_AUTH_ATTEMPTS) {
        const lockoutTime = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION;
        applyIfMounted(() => setLockoutUntil(lockoutTime));
        applyIfMounted(() => setAuthAttempts(0));
        // Persist lockout to AsyncStorage with attempt count
        await AsyncStorage.setItem(
          STORAGE_KEYS.AUTH_ATTEMPTS,
          JSON.stringify({
            count: SECURITY_CONFIG.MAX_AUTH_ATTEMPTS,
            timestamp: Date.now(),
          }),
        );
        logger.warn('[Security] Maximum authentication attempts exceeded - account locked');
        throw new Error(
          `Too many failed attempts. Account locked for ${SECURITY_CONFIG.LOCKOUT_DURATION / 60000} minutes.`,
        );
      }

      const remainingAttempts = SECURITY_CONFIG.MAX_AUTH_ATTEMPTS - newAttempts;
      logger.warn(`[Security] Authentication failed. ${remainingAttempts} attempt(s) remaining.`);

      return false;
    } catch (error) {
      logger.error('[Security] Authentication error:', error as Error);
      throw error;
    } finally {
      dropActive();
    }
  };

  const exitParentMode = () => {
    clearSessionTimeout();
    applyIfMounted(() => setIsParentMode(false));
    logger.info('[Security] Exited parent mode');
  };
  const setParentPin = async (pin: string) => {
    // Validate PIN (should be 4-6 digits) before touching active ops
    if (!/^[0-9]{4,6}$/.test(pin)) {
      return Promise.reject(new Error('PIN must be 4-6 digits'));
    }
    bumpActive();
    try {
      logger.debug('[TestDebug] setParentPin start');

      // Generate new salt
      const salt = await generateSalt();
      logger.debug('[TestDebug] generated salt', { salt });

      // Hash the PIN with the salt
      const hash = await hashPinWithSalt(pin, salt);
      logger.debug('[TestDebug] generated hash', { hash });

      // Store hash and salt in SecureStore (encrypted storage)
      await SecureStore.setItemAsync(STORAGE_KEYS.PIN_HASH, hash);
      logger.debug('[TestDebug] stored hash');
      await SecureStore.setItemAsync(STORAGE_KEYS.PIN_SALT, salt);
      logger.debug('[TestDebug] stored salt');

      // Remove plain text PIN from settings if it exists
      const newSettings = { ...settings };
      delete (newSettings as any).parentPin;
      await saveSettings(newSettings);

      // Reset authentication attempts
      applyIfMounted(() => setAuthAttempts(0));
      applyIfMounted(() => setLockoutUntil(null));
      try {
        mainStorage.delete(STORAGE_KEYS.AUTH_ATTEMPTS);
      } catch (e) {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_ATTEMPTS);
      }

      logger.info('[Security] PIN updated successfully with secure hashing');
    } catch (error) {
      logger.error('[Security] Failed to set PIN:', error as Error);
      throw error;
    } finally {
      dropActive();
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
