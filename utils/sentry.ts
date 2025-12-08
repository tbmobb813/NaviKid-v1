/**
 * Sentry Error Tracking & Crash Reporting Integration
 *
 * Configures error tracking, performance monitoring, and crash reporting
 * for production use with environment-specific settings.
 */

import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';

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
      logger.info('Sentry disabled: DSN not configured', {
        environment: config.environment,
      });
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
        beforeSend(event: SentryEvent, hint?: SentryHint): SentryEvent | null {
          // Filter out specific errors if needed
          if (event && event.exception) {
            const error = hint?.originalException;

            // Don't send authentication errors from user testing
            if (error instanceof Error && error.message.includes('401')) {
              return null; // Discard
            }
          }

          return event;
        },

        // Breadcrumb filtering
        beforeBreadcrumb(breadcrumb: Breadcrumb) {
          // Filter sensitive data from breadcrumbs
          const bc = breadcrumb || {};
          if (bc.category === 'http') {
            // Don't log request bodies with sensitive data
            if (bc.data && typeof bc.data === 'object' && String(bc.data.url || '').includes('/auth')) {
              bc.data = { url: '[redacted]' } as Record<string, unknown>;
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
      logger.info('Sentry initialized successfully', {
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
      logger.warn('Sentry failed to initialize', {
        error: err,
        environment: config.environment,
      });
    }
    return createFallbackSentry();
  }
}

/**
 * Create a fallback Sentry mock for when Sentry is disabled or fails to initialize
 */
function createFallbackSentry() {
  const fallback = {
    captureException: (error: unknown, context?: unknown) => {
      logger.error('Sentry fallback captured exception', error as Error, { context });
      return 'fallback-event-id';
    },
    captureMessage: (message: string, level?: string) => {
      const logLevel = level?.toLowerCase() || 'info';
      if (logLevel === 'error') {
        logger.error('Sentry fallback message', new Error(message));
      } else if (logLevel === 'warning') {
        logger.warn('Sentry fallback message', { message });
      } else {
        logger.info('Sentry fallback message', { message, level: logLevel });
      }
      return 'fallback-event-id';
    },
    captureEvent: (event: unknown) => {
      logger.debug('Sentry fallback captured event', { event });
      return 'fallback-event-id';
    },
    addBreadcrumb: (_breadcrumb: Breadcrumb) => {
      // Silently ignore breadcrumbs when Sentry is disabled
    },
    setUser: (_user: unknown) => {
      // Silently ignore user context when Sentry is disabled
    },
    withScope: (callback: (scope: SentryScope) => void) => {
      callback({
        setTag: () => {},
        setContext: () => {},
        setLevel: () => {},
      });
    },
    setTag: (_k: string, _v: string) => {},
    setContext: (_k: string, _v: unknown) => {},
    setLevel: (_l: string) => {},
    startTransaction: () => ({
      startChild: () => ({ finish: () => {} }),
      finish: () => {},
    }),
  };

  return fallback;
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
export function createErrorBoundary(Sentry: SentryLike | null) {
  if (!Sentry || !('ErrorBoundary' in Sentry) || !Sentry.ErrorBoundary) {
    // Return null if Sentry ErrorBoundary isn't available
    return null;
  }

  return (Sentry as any).ErrorBoundary;
}

/** Local minimal Sentry-related typings used to avoid spreading `any` */
type SentryEvent = { exception?: unknown; level?: string; [key: string]: unknown };
type SentryHint = { originalException?: unknown; [key: string]: unknown };
type Breadcrumb = { category?: string; data?: Record<string, unknown> | null; [key: string]: unknown };
type SentryScope = { setTag: (k: string, v: string) => void; setContext: (k: string, v: unknown) => void; setLevel: (l: string) => void };
type SentryLike = {
  init?: (opts?: unknown) => void;
  setUser?: (user: unknown) => void;
  captureMessage?: (message: string, level?: string) => string;
  captureException?: (error: unknown, context?: unknown) => string;
  captureEvent?: (event: unknown) => string;
  addBreadcrumb?: (bc: Breadcrumb) => void;
  withScope?: (cb: (scope: SentryScope) => void) => void;
  ErrorBoundary?: unknown;
  setTag?: (k: string, v: string) => void;
  setContext?: (k: string, v: unknown) => void;
  setLevel?: (l: string) => void;
  startTransaction?: (...args: unknown[]) => { startChild: () => { finish: () => void }; finish: () => void };
};
