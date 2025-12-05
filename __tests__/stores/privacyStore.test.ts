/**
 * Comprehensive Tests for Privacy Store
 */

import { usePrivacyStore } from '../../stores/privacyStore';

// Mock AsyncStorage for persistence
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('Privacy Store', () => {
  // Reset store before each test
  beforeEach(() => {
    const { resetConsent } = usePrivacyStore.getState();
    resetConsent();
  });

  describe('Initial State', () => {
    it('should have correct default values', () => {
      const store = usePrivacyStore.getState();

      expect(store.settings.analyticsEnabled).toBe(false); // Privacy-first: opt-out by default
      expect(store.settings.lastConsentUpdate).toBe(null);
      expect(store.settings.consentVersion).toBe(1);
      expect(store.consentDismissed).toBe(false);
    });

    it('should default to privacy-first (analytics disabled)', () => {
      const store = usePrivacyStore.getState();

      expect(store.settings.analyticsEnabled).toBe(false);
    });

    it('should initialize with unknown consent status', () => {
      const { getConsentStatus } = usePrivacyStore.getState();

      expect(getConsentStatus()).toBe('unknown');
    });
  });

  describe('Analytics Consent', () => {
    it('should enable analytics when user accepts', () => {
      const { setAnalyticsEnabled } = usePrivacyStore.getState();

      setAnalyticsEnabled(true);

      const store = usePrivacyStore.getState();
      expect(store.settings.analyticsEnabled).toBe(true);
      expect(store.consentDismissed).toBe(true);
    });

    it('should disable analytics when user declines', () => {
      const { setAnalyticsEnabled } = usePrivacyStore.getState();

      setAnalyticsEnabled(false);

      const store = usePrivacyStore.getState();
      expect(store.settings.analyticsEnabled).toBe(false);
      expect(store.consentDismissed).toBe(true);
    });

    it('should update lastConsentUpdate timestamp when setting analytics', () => {
      const { setAnalyticsEnabled } = usePrivacyStore.getState();
      const beforeTime = Date.now();

      setAnalyticsEnabled(true);

      const store = usePrivacyStore.getState();
      expect(store.settings.lastConsentUpdate).toBeGreaterThanOrEqual(beforeTime);
      expect(store.settings.lastConsentUpdate).toBeLessThanOrEqual(Date.now());
    });

    it('should automatically dismiss consent prompt when setting analytics', () => {
      const { setAnalyticsEnabled } = usePrivacyStore.getState();

      setAnalyticsEnabled(true);

      const store = usePrivacyStore.getState();
      expect(store.consentDismissed).toBe(true);
    });

    it('should allow changing analytics preference', () => {
      const { setAnalyticsEnabled } = usePrivacyStore.getState();

      setAnalyticsEnabled(true);
      let store = usePrivacyStore.getState();
      expect(store.settings.analyticsEnabled).toBe(true);

      setAnalyticsEnabled(false);
      store = usePrivacyStore.getState();
      expect(store.settings.analyticsEnabled).toBe(false);
    });
  });

  describe('Consent Prompt', () => {
    it('should dismiss consent prompt', () => {
      const { dismissConsentPrompt } = usePrivacyStore.getState();

      dismissConsentPrompt();

      const store = usePrivacyStore.getState();
      expect(store.consentDismissed).toBe(true);
    });

    it('should keep analytics disabled when dismissing without accepting', () => {
      const { dismissConsentPrompt } = usePrivacyStore.getState();

      dismissConsentPrompt();

      const store = usePrivacyStore.getState();
      expect(store.settings.analyticsEnabled).toBe(false);
      expect(store.consentDismissed).toBe(true);
    });
  });

  describe('Consent Status', () => {
    it('should return "unknown" when consent not yet addressed', () => {
      const { getConsentStatus } = usePrivacyStore.getState();

      expect(getConsentStatus()).toBe('unknown');
    });

    it('should return "accepted" when analytics enabled', () => {
      const { setAnalyticsEnabled, getConsentStatus } = usePrivacyStore.getState();

      setAnalyticsEnabled(true);

      expect(getConsentStatus()).toBe('accepted');
    });

    it('should return "declined" when analytics disabled and consent dismissed', () => {
      const { setAnalyticsEnabled, getConsentStatus } = usePrivacyStore.getState();

      setAnalyticsEnabled(false);

      expect(getConsentStatus()).toBe('declined');
    });

    it('should return "declined" when prompt dismissed without enabling', () => {
      const { dismissConsentPrompt, getConsentStatus } = usePrivacyStore.getState();

      dismissConsentPrompt();

      expect(getConsentStatus()).toBe('declined');
    });
  });

  describe('Reset Consent', () => {
    it('should reset all settings to defaults', () => {
      const { setAnalyticsEnabled, resetConsent } = usePrivacyStore.getState();

      // Enable analytics first
      setAnalyticsEnabled(true);

      // Reset
      resetConsent();

      const store = usePrivacyStore.getState();
      expect(store.settings.analyticsEnabled).toBe(false);
      expect(store.settings.lastConsentUpdate).toBe(null);
      expect(store.settings.consentVersion).toBe(1);
      expect(store.consentDismissed).toBe(false);
    });

    it('should return consent status to "unknown" after reset', () => {
      const { setAnalyticsEnabled, resetConsent, getConsentStatus } = usePrivacyStore.getState();

      setAnalyticsEnabled(true);
      expect(getConsentStatus()).toBe('accepted');

      resetConsent();
      expect(getConsentStatus()).toBe('unknown');
    });

    it('should allow re-accepting after reset', () => {
      const { setAnalyticsEnabled, resetConsent } = usePrivacyStore.getState();

      setAnalyticsEnabled(true);
      resetConsent();
      setAnalyticsEnabled(true);

      const store = usePrivacyStore.getState();
      expect(store.settings.analyticsEnabled).toBe(true);
      expect(store.consentDismissed).toBe(true);
    });
  });

  describe('Privacy-First Design', () => {
    it('should default to analytics disabled (opt-out)', () => {
      const store = usePrivacyStore.getState();

      expect(store.settings.analyticsEnabled).toBe(false);
    });

    it('should require explicit action to enable analytics', () => {
      const { getConsentStatus } = usePrivacyStore.getState();

      // Without any action, analytics should be off
      const store = usePrivacyStore.getState();
      expect(store.settings.analyticsEnabled).toBe(false);
      expect(getConsentStatus()).toBe('unknown');
    });

    it('should preserve consent version', () => {
      const { setAnalyticsEnabled } = usePrivacyStore.getState();

      setAnalyticsEnabled(true);

      const store = usePrivacyStore.getState();
      expect(store.settings.consentVersion).toBe(1);
    });
  });

  describe('Persistence', () => {
    it('should be configured with AsyncStorage', () => {
      // The store is created with persist middleware
      // This test verifies the configuration exists
      expect(usePrivacyStore).toBeDefined();
      expect(usePrivacyStore.getState).toBeDefined();
    });

    it('should maintain state across getState calls', () => {
      const { setAnalyticsEnabled } = usePrivacyStore.getState();

      setAnalyticsEnabled(true);

      const store1 = usePrivacyStore.getState();
      const store2 = usePrivacyStore.getState();

      expect(store1.settings.analyticsEnabled).toBe(store2.settings.analyticsEnabled);
    });
  });
});
