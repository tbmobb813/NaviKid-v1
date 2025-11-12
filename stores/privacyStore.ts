/**
 * Privacy & Consent Store
 *
 * Manages user consent for analytics and tracking.
 * Implements privacy-first design: opt-out by default.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PrivacySettings {
  // Analytics consent
  analyticsEnabled: boolean;
  // When consent was given/updated
  lastConsentUpdate: number | null;
  // Version of consent flow shown
  consentVersion: number;
}

interface PrivacyStore {
  // State
  settings: PrivacySettings;
  consentDismissed: boolean;

  // Actions
  setAnalyticsEnabled: (enabled: boolean) => void;
  dismissConsentPrompt: () => void;
  resetConsent: () => void;
  getConsentStatus: () => 'accepted' | 'declined' | 'unknown';
}

const DEFAULT_SETTINGS: PrivacySettings = {
  analyticsEnabled: false, // Default: opt-out (privacy-first)
  lastConsentUpdate: null,
  consentVersion: 1,
};

export const usePrivacyStore = create<PrivacyStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      consentDismissed: false,

      setAnalyticsEnabled: (enabled: boolean) => {
        set((state) => ({
          settings: {
            ...state.settings,
            analyticsEnabled: enabled,
            lastConsentUpdate: Date.now(),
          },
          consentDismissed: true,
        }));
      },

      dismissConsentPrompt: () => {
        set({ consentDismissed: true });
      },

      resetConsent: () => {
        set({
          settings: DEFAULT_SETTINGS,
          consentDismissed: false,
        });
      },

      getConsentStatus: () => {
        const { settings, consentDismissed } = get();

        if (!consentDismissed) {
          return 'unknown';
        }

        return settings.analyticsEnabled ? 'accepted' : 'declined';
      },
    }),
    {
      name: 'privacy-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
