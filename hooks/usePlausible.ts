/**
 * Plausible Analytics Hook
 *
 * Integrates Plausible Analytics with privacy-aware event tracking.
 * Only sends events if user has given consent.
 */

import { useEffect } from 'react';
import { usePrivacyStore } from '@/stores/privacyStore';
import { analytics } from '@/utils/analytics';
import { Config } from '@/utils/config';

/**
 * Initialize analytics based on privacy consent
 *
 * @returns Object with tracking functions
 */
export function usePlausible() {
  const { settings } = usePrivacyStore();

  // Enable/disable analytics based on consent
  useEffect(() => {
    const isEnabled = settings.analyticsEnabled && Config.ANALYTICS.ENABLED;
    analytics.setEnabled(isEnabled);

    if (isEnabled) {
      console.log('[Analytics] Plausible enabled');
    }
  }, [settings.analyticsEnabled]);

  return {
    // Check if analytics is enabled
    isEnabled: settings.analyticsEnabled,

    // Track page/screen view
    trackPageView: (screenName: string, properties?: Record<string, unknown>) => {
      if (settings.analyticsEnabled) {
        analytics.screen(screenName, properties);
      }
    },

    // Track user action
    trackUserAction: (action: string, properties?: Record<string, unknown>) => {
      if (settings.analyticsEnabled) {
        analytics.userAction(action, properties);
      }
    },

    // Track feature usage
    trackFeature: (feature: string, properties?: Record<string, unknown>) => {
      if (settings.analyticsEnabled) {
        analytics.track('feature_used', {
          feature,
          ...properties,
        });
      }
    },

    // Track custom event
    trackEvent: (eventName: string, properties?: Record<string, unknown>) => {
      if (settings.analyticsEnabled) {
        analytics.track(eventName, properties);
      }
    },

    // Track error
    trackError: (error: Error, context?: string) => {
      if (settings.analyticsEnabled) {
        analytics.error(error, context);
      }
    },

    // Flush pending events
    flush: async () => {
      await analytics.flush(true);
    },
  };
}

/**
 * Initialize Plausible Analytics on app startup
 * Called from app entry point
 */
export async function initializePlausible() {
  const privacyStore = usePrivacyStore.getState();
  const isEnabled = privacyStore.settings.analyticsEnabled && Config.ANALYTICS.ENABLED;

  analytics.setEnabled(isEnabled);

  console.log('[Analytics] Initialized', {
    enabled: isEnabled,
    consentStatus: privacyStore.getConsentStatus(),
    endpoint: Config.ANALYTICS.PLAUSIBLE.ENDPOINT,
    siteId: Config.ANALYTICS.PLAUSIBLE.SITE_ID,
  });
}
