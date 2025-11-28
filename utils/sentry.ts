/**
 * Sentry Error Tracking & Crash Reporting Integration
 *
 * Configures error tracking, performance monitoring, and crash reporting
 * for production use with environment-specific settings.
 */

import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

export interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  autoSessionTracking: boolean;
  profileSampleRate: number;
}

/**
 * Initialize Sentry with comprehensive error tracking configuration
 *
 * Features:
 * - Error and exception tracking
 * - Performance monitoring with traces
 * - Automatic session tracking
 * - Release and version information
 * - Device and platform information
 * - Breadcrumb tracking for debugging
 *
 * @param config - Sentry configuration object
 * @returns Sentry SDK instance or fallback mock
 */
export function initSentry(config: SentryConfig) {
  // No-op when DSN is not provided
  if (!config.dsn || config.dsn.trim() === '') {
    if (config.environment === 'development') {
      console.log('[Sentry] Disabled: DSN not configured');
    }
    return createFallbackSentry();
  }

  try {
    // Lazy-import so local dev without Sentry dependency won't fail
    const Sentry = require('@sentry/react-native');

    const releaseVersion = Application.nativeApplicationVersion || '1.0.0';
    const buildNumber = Application.nativeBuildVersion || '1';
    const releaseName = `kid-friendly-map@${releaseVersion}+${buildNumber}`;

    // Initialize Sentry with full configuration
    Sentry.init({
      // Core Sentry settings
      dsn: config.dsn,
      environment: config.environment,
      release: releaseName,
      dist: buildNumber,

      // Performance monitoring
      tracesSampleRate: config.tracesSampleRate,
      enablePerformanceMonitoring: config.environment !== 'development',

      // Session tracking
      autoSessionTracking: config.autoSessionTracking,
      sessionTrackingIntervalMillis: 5000, // 5 seconds (default)

      // Profiling (performance analysis)
      profilesSampleRate: config.profileSampleRate,

      // Error tracking
      enableCaptureFailedRequests: true,
      captureFailedRequestsPercentage: 100,
      failedRequestStatusCodes: [[400, 599]],

      // Enable auto-capturing of events
      attachStacktrace: true,
      includeLocalVariables: config.environment === 'development',
      maxBreadcrumbs: 100,
      maxAttachmentSize: 20_971_520, // 20 MB

      // Platform-specific configuration
      enableAppHangDetection: true,
      appHangTimeoutIntervalMillis: 5000,

      // Before sending error events
      beforeSend(event: unknown, hint: unknown) {
        // Filter out specific errors if needed
        if ((event as any).exception) {
          const error = (hint as any)?.originalException;

          // Don't send authentication errors from user testing
          if (error instanceof Error && error.message.includes('401')) {
            return null; // Discard
          }
        }

        return event as any;
      },

      // Breadcrumb filtering
      beforeBreadcrumb(breadcrumb: unknown) {
        // Filter sensitive data from breadcrumbs
        const bc = breadcrumb as any;
        if (bc.category === 'http') {
          // Don't log request bodies with sensitive data
          if (bc.data?.url?.includes('/auth')) {
            bc.data = { url: '[redacted]' };
          }
        }
        return bc;
      },

      // Initialize with defaults
      initialScope: {
        tags: {
          platform: Platform.OS,
          app_name: 'kid-friendly-map',
          version: releaseVersion,
        },
        contexts: {
          app: {
            name: 'Kid-Friendly Map & Transit Navigator',
            version: releaseVersion,
            build: buildNumber,
          },
          device: {
            screen_density: Platform.OS === 'ios' ? 'N/A' : 'default',
          },
        },
      },
    });

    // Only log Sentry initialization in development
    if (config.environment === 'development') {
      console.log('[Sentry] Initialized successfully', {
        environment: config.environment,
        release: releaseName,
        platform: Platform.OS,
      });
    }

    // Set user context (clear if not authenticated)
    Sentry.setUser(null);

    // Capture app update information if available
    if (Updates.isEmbeddedLaunch !== undefined && !Updates.isEmbeddedLaunch) {
      try {
        // Only log updates info if running under EAS Updates
        Sentry.captureMessage(
          `App launched with expo-updates in ${Updates.isEmbeddedLaunch ? 'embedded' : 'dynamic'} mode`,
          'info',
        );
      } catch (error) {
        // Silently ignore OTA update errors
      }
    }

    return Sentry;
  } catch (err) {
    if (config.environment === 'development') {
      console.warn('[Sentry] Failed to initialize', err);
    }
    return createFallbackSentry();
  }
}

/**
 * Create a fallback Sentry mock for when Sentry is disabled or fails to initialize
 */
function createFallbackSentry() {
  return {
    captureException: (error: any, context?: any) => {
      console.error('[Sentry Fallback] Exception:', error, context);
      return 'fallback-event-id';
    },
    captureMessage: (message: string, level?: string) => {
      console.log(`[Sentry Fallback] ${level?.toUpperCase() || 'INFO'}: ${message}`);
      return 'fallback-event-id';
    },
    captureEvent: (event: any) => {
      console.log('[Sentry Fallback] Event:', event);
      return 'fallback-event-id';
    },
    addBreadcrumb: (breadcrumb: any) => {
      // Silently ignore breadcrumbs when Sentry is disabled
    },
    setUser: (user: any) => {
      // Silently ignore user context when Sentry is disabled
    },
    withScope: (callback: (scope: any) => void) => {
      callback({
        setTag: () => {},
        setContext: () => {},
        setLevel: () => {},
      });
    },
    setTag: () => {},
    setContext: () => {},
    setLevel: () => {},
    startTransaction: () => ({
      startChild: () => ({ finish: () => {} }),
      finish: () => {},
    }),
  };
}

/**
 * Create a Sentry Error Boundary component for React
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * @param Sentry - Sentry SDK instance
 * @returns Error boundary component
 */
export function createErrorBoundary(Sentry: any) {
  if (!Sentry || !Sentry.ErrorBoundary) {
    // Return Sentry's error boundary if available
    return null;
  }

  return Sentry.ErrorBoundary;
}
