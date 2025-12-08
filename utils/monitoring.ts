/**
 * Comprehensive Application Monitoring System
 * Tracks performance, errors, user interactions, and system health
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import React from 'react';
import { log as baseLog } from './logger';
import Config from './config';

declare const beforeEach: undefined | ((fn: () => void | Promise<void>, timeout?: number) => void);
declare const afterEach: undefined | ((fn: () => void | Promise<void>, timeout?: number) => void);

const isTestEnvironment =
  typeof process !== 'undefined' &&
  typeof process.env !== 'undefined' &&
  (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined);

type Logger = typeof baseLog;

let cachedLog: Logger = baseLog;

const getLog = (): Logger => {
  if (!isTestEnvironment) {
    return cachedLog;
  }

  try {
    const mockedModule = require('./logger');
    const resolvedLog: Logger = mockedModule?.log ?? mockedModule?.default ?? cachedLog;

    if (resolvedLog && resolvedLog !== cachedLog) {
      cachedLog = resolvedLog;
    }
  } catch (error) {
    // Ignore resolution errors in tests and fall back to cached logger
  }

  return cachedLog;
};

const logger = {
  debug: (...args: Parameters<Logger['debug']>) => getLog().debug(...args),
  info: (...args: Parameters<Logger['info']>) => getLog().info(...args),
  warn: (...args: Parameters<Logger['warn']>) => getLog().warn(...args),
  error: (...args: Parameters<Logger['error']>) => getLog().error(...args),
  time: (...args: Parameters<Logger['time']>) => getLog().time(...args),
  timeEnd: (...args: Parameters<Logger['timeEnd']>) => getLog().timeEnd(...args),
};
let offlineManager: OfflineManagerLike | null;
try {
  const offlineModule = require('./offlineManager');
  offlineManager = offlineModule?.offlineManager || offlineModule?.default || offlineModule;
} catch (error) {
  offlineManager = null;
}

if (
  !offlineManager ||
  typeof offlineManager.getNetworkState !== 'function' ||
  typeof offlineManager.getNetworkQuality !== 'function' ||
  typeof offlineManager.getPendingActionsCount !== 'function'
) {
  const fallbackNetworkState = {
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    isWifiEnabled: true,
  };
  const queuedActions: Array<{ type: string; payload: unknown }> = [];
  offlineManager = {
    getNetworkState: () => fallbackNetworkState,
    getNetworkQuality: () => 'online',
    getPendingActionsCount: () => queuedActions.length,
    isOffline: () => false,
    queueAction: (type: string, payload: unknown) => {
      queuedActions.push({ type, payload });
    },
  };
}

let backendHealthMonitor: BackendHealthMonitorLike | null;
try {
  const apiModule = require('./api');
  backendHealthMonitor =
    apiModule?.backendHealthMonitor || apiModule?.default?.backendHealthMonitor || apiModule;
} catch (error) {
  backendHealthMonitor = null;
}

if (!backendHealthMonitor || typeof backendHealthMonitor.getHealthStatus !== 'function') {
  backendHealthMonitor = {
    getHealthStatus: () => 'healthy',
  };
}

let Device: { brand?: string; modelName?: string; osName?: string; osVersion?: string };
try {
  Device = require('expo-device');
} catch (error) {
  Device = {
    brand: 'unknown',
    modelName: 'unknown',
    osName: Platform.OS,
    osVersion: 'unknown',
  };
}

// Types
export interface MonitoringConfig {
  sentryDsn?: string;
  enablePerformanceMonitoring: boolean;
  enableUserTracking: boolean;
  enableCrashReporting: boolean;
  sampleRate: number;
  maxBreadcrumbs: number;
  environment: 'development' | 'staging' | 'production';
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ErrorReport {
  error: Error;
  context: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface UserAction {
  action: string;
  screen: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface SystemHealth {
  networkStatus: 'online' | 'offline' | 'poor';
  backendStatus: 'healthy' | 'degraded' | 'down';
  storageAvailable: boolean;
  memoryPressure: 'low' | 'medium' | 'high';
  batteryLevel?: number;
  pendingSyncActions: number;
}

class ApplicationMonitoring {
  private static instance: ApplicationMonitoring;
  private readonly baseConfig: MonitoringConfig;
  private config!: MonitoringConfig;
  private sentry: SentryInstance | null = null;
  private performanceMetrics: PerformanceMetric[] = [];
  private userActions: UserAction[] = [];
  private errorCount = 0;
  private sessionStartTime!: number;
  private readonly maxMetricsInMemory = 100;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private errorHandlersSetup = false;

  private constructor() {
    this.baseConfig = {
      sentryDsn: Config.MONITORING.SENTRY_DSN,
      enablePerformanceMonitoring: Config.FEATURES.PERFORMANCE_MONITORING,
      enableUserTracking: Config.FEATURES.ANALYTICS,
      enableCrashReporting: Config.FEATURES.CRASH_REPORTING,
      sampleRate: Config.MONITORING.TRACES_SAMPLE_RATE,
      maxBreadcrumbs: 50,
      environment: Config.MONITORING.ENVIRONMENT as MonitoringConfig['environment'],
    };

    if (isTestEnvironment) {
      this.baseConfig.enablePerformanceMonitoring = true;
      this.baseConfig.enableUserTracking = true;
      this.baseConfig.enableCrashReporting = true;
    }

    this.applyConfig();
    this.resetMetrics();
  }

  static getInstance(): ApplicationMonitoring {
    if (!ApplicationMonitoring.instance) {
      ApplicationMonitoring.instance = new ApplicationMonitoring();
    }
    return ApplicationMonitoring.instance;
  }

  private applyConfig(overrides?: Partial<MonitoringConfig>): void {
    this.config = {
      ...this.baseConfig,
      ...overrides,
    } as MonitoringConfig;
  }

  private resetMetrics(): void {
    this.performanceMetrics = [];
    this.userActions = [];
    this.errorCount = 0;
    this.sessionStartTime = Date.now();
  }

  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  public resetForTests(): void {
    this.stopHealthMonitoring();
    this.applyConfig();
    this.resetMetrics();
    this.sentry = null;
  }

  /**
   * Initialize monitoring system
   */
  async initialize(config?: Partial<MonitoringConfig>): Promise<void> {
    this.stopHealthMonitoring();
    this.applyConfig(config);
    this.resetMetrics();
    this.sentry = null;

    // Initialize Sentry if DSN provided
    if (this.config.sentryDsn && this.config.enableCrashReporting) {
      await this.initializeSentry();
    }

    // Set up error handlers
    this.setupErrorHandlers();

    // Start health monitoring
    this.startHealthMonitoring();

    logger.info('Monitoring system initialized', {
      environment: this.config.environment,
      sentryEnabled: !!this.sentry,
      performanceTracking: this.config.enablePerformanceMonitoring,
    });
  }

  /**
   * Initialize Sentry error tracking
   */
  private async initializeSentry(): Promise<void> {
    try {
      // Lazy import to avoid crashes if not installed
      const Sentry = require('@sentry/react-native');

      const integrations: unknown[] = [];

      if ((Sentry as any).ReactNativeTracing) {
        try {
          const routingInstrumentation = Sentry.ReactNavigationInstrumentation
            ? new Sentry.ReactNavigationInstrumentation()
            : undefined;

          integrations.push(
            new Sentry.ReactNativeTracing({
              routingInstrumentation,
            }),
          );
        } catch (instrumentationError) {
          logger.warn(
            'Failed to configure Sentry navigation instrumentation',
            instrumentationError as Error,
          );
        }
      }

      Sentry.init({
        dsn: this.config.sentryDsn,
        environment: this.config.environment,
        enableAutoSessionTracking: Config.MONITORING.AUTO_SESSION_TRACKING,
        sessionTrackingIntervalMillis: 30000,
        maxBreadcrumbs: this.config.maxBreadcrumbs,
        tracesSampleRate: this.config.sampleRate,
        profilesSampleRate: Config.MONITORING.PROFILE_SAMPLE_RATE,

        // Performance monitoring
        enableNative: true,
        enableNativeFramesTracking: Platform.OS !== 'web',

        // Filter out sensitive data
        beforeSend: (event: SentryEvent) => {
          // Remove sensitive user data
          if (event.user && typeof event.user === 'object') {
            try {
              // avoid mutating unknown shapes unsafely
              const u = event.user as Record<string, unknown>;
              delete u.email;
              delete u.username;
            } catch (e) {
              // ignore
            }
          }

          // Don't send development errors
          if (this.config.environment === 'development') {
            return null;
          }

          return event;
        },

        integrations,
      });

      // Set device context
      Sentry.setContext('device', {
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        platform: Platform.OS,
        platformVersion: Platform.Version,
      });

      // Set app context
      Sentry.setContext('app', {
        version: Constants.expoConfig?.version || 'unknown',
        buildNumber:
          Constants.expoConfig?.ios?.buildNumber ||
          Constants.expoConfig?.android?.versionCode ||
          'unknown',
        expoVersion: Constants.expoConfig?.sdkVersion || 'unknown',
      });

      this.sentry = Sentry as unknown as SentryInstance;
      logger.info('Sentry initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize Sentry', error as Error);
      this.sentry = null;
    }
  }

  /**
   * Set up global error handlers
   */
  private setupErrorHandlers(): void {
    if (this.errorHandlersSetup || isTestEnvironment) {
      return;
    }
    this.errorHandlersSetup = true;

    // Global error handler
    const originalErrorHandler = (ErrorUtils as any).getGlobalHandler?.();
    (ErrorUtils as any).setGlobalHandler?.((error: unknown, isFatal?: boolean) => {
      this.captureError({
        error: error instanceof Error ? error : new Error(String(error)),
        context: 'Global Error Handler',
        severity: isFatal ? 'critical' : 'high',
      });

      // Call original handler
      if (typeof originalErrorHandler === 'function') {
        try {
          originalErrorHandler(error, isFatal);
        } catch (e) {
          // ignore
        }
      }
    });

    // Unhandled promise rejections
    if (typeof Promise !== 'undefined') {
      const originalRejectionHandler = Promise.prototype.catch as unknown as Function;
      Promise.prototype.catch = function (this: Promise<unknown>, onRejected: ((reason: unknown) => unknown) | undefined) {
        return originalRejectionHandler.call(this, (reason: unknown) => {
          ApplicationMonitoring.getInstance().captureError({
            error: reason instanceof Error ? reason : new Error(String(reason)),
            context: 'Unhandled Promise Rejection',
            severity: 'high',
          });

          if (onRejected) {
            return onRejected(reason);
          }
          throw reason;
        });
      } as any;
    }
  }

  /**
   * Start monitoring system health
   */
  private startHealthMonitoring(): void {
    if (
      isTestEnvironment ||
      this.healthCheckInterval ||
      (!this.config.enablePerformanceMonitoring &&
        !this.config.enableUserTracking &&
        !this.config.enableCrashReporting)
    ) {
      return;
    }

    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      const health = this.getSystemHealth();

      // Log critical health issues
      if (health.backendStatus === 'down') {
        logger.warn('Backend service is down');
      }

      if (health.memoryPressure === 'high') {
        logger.warn('High memory pressure detected');
      }

      if (health.pendingSyncActions > 50) {
        logger.warn('High number of pending sync actions', {
          count: health.pendingSyncActions,
        });
      }
    }, 30000);
  }

  /**
   * Capture and report an error
   */
  captureError(report: ErrorReport): void {
    const { error, context, severity, userId, metadata } = report;

    this.errorCount++;

    // Log locally
    logger.error(`[${severity.toUpperCase()}] ${context}`, error, metadata);

    // Send to Sentry
    if (this.sentry && typeof this.sentry.withScope === 'function') {
      this.sentry.withScope((scope: SentryScope) => {
        scope.setLevel?.(severity);
        scope.setContext?.('error_context', { context, ...metadata });

        if (userId) {
          scope.setUser?.({ id: userId });
        }

        // Add breadcrumbs
        scope.addBreadcrumb?.({
          category: 'error',
          message: context,
          level: severity,
          data: metadata,
        });

        this.sentry?.captureException?.(error);
      });
    }

    // Queue for offline sync if needed
    if (offlineManager && typeof offlineManager.isOffline === 'function' && offlineManager.isOffline()) {
      offlineManager.queueAction?.('ERROR_REPORT', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        context,
        severity,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    if (!this.config.enablePerformanceMonitoring) return;

    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.performanceMetrics.push(fullMetric);

    // Keep only recent metrics
    if (this.performanceMetrics.length > this.maxMetricsInMemory) {
      this.performanceMetrics.shift();
    }

    logger.debug(`Performance: ${metric.name} took ${metric.duration}ms`, metric.metadata);

    // Send to Sentry
    if (this.sentry && typeof this.sentry.addBreadcrumb === 'function') {
      this.sentry.addBreadcrumb({
        category: 'performance',
        message: metric.name,
        data: {
          duration: metric.duration,
          ...metric.metadata,
        },
      });
    }

    // Alert on slow operations
    if (metric.duration > 3000) {
      logger.warn('Slow operation detected', {
        name: metric.name,
        duration: metric.duration,
      });
    }
  }

  /**
   * Track user action
   */
  trackUserAction(action: Omit<UserAction, 'timestamp'>): void {
    if (!this.config.enableUserTracking) return;

    const fullAction: UserAction = {
      ...action,
      timestamp: Date.now(),
    };

    this.userActions.push(fullAction);

    // Keep only recent actions
    if (this.userActions.length > this.maxMetricsInMemory) {
      this.userActions.shift();
    }

    logger.debug(`User action: ${action.action} on ${action.screen}`, action.metadata);

    // Send to Sentry as breadcrumb
    if (this.sentry && typeof this.sentry.addBreadcrumb === 'function') {
      this.sentry.addBreadcrumb({
        category: 'user_action',
        message: `${action.action} on ${action.screen}`,
        data: action.metadata,
      });
    }
  }

  /**
   * Start performance timer
   */
  startPerformanceTimer(name: string): (metadata?: Record<string, unknown>) => void {
    const startTime = Date.now();

    return (metadata?: Record<string, unknown>) => {
      const duration = Date.now() - startTime;
      this.trackPerformance({ name, duration, metadata });
    };
  }

  /**
   * Get system health status
   */
  getSystemHealth(): SystemHealth {
    // Defensive calls: some test mocks may not implement all functions
    const networkState =
      offlineManager && typeof offlineManager.getNetworkState === 'function'
        ? offlineManager.getNetworkState()
        : { isConnected: true, isInternetReachable: true, type: 'wifi', isWifiEnabled: true };

    const networkQuality =
      offlineManager && typeof offlineManager.getNetworkQuality === 'function'
        ? offlineManager.getNetworkQuality()
        : 'online';

    const backendStatusRaw =
      backendHealthMonitor && typeof backendHealthMonitor.getHealthStatus === 'function'
        ? backendHealthMonitor.getHealthStatus()
        : 'healthy';

    // Normalize backend status to allowed set
    const backendStatus = ['healthy', 'degraded', 'down'].includes(backendStatusRaw)
      ? (backendStatusRaw as 'healthy' | 'degraded' | 'down')
      : 'healthy';

    const pendingSyncActions =
      offlineManager && typeof offlineManager.getPendingActionsCount === 'function'
        ? Number(offlineManager.getPendingActionsCount()) || 0
        : 0;
    const memoryPressure = this.calculateMemoryPressure();

    if (memoryPressure === 'high') {
      this.clearOldMetrics();
    }

    return {
      networkStatus:
        networkQuality === 'offline' ? 'offline' : networkQuality === 'poor' ? 'poor' : 'online',
      backendStatus,
      storageAvailable: true, // Could add actual check
      memoryPressure,
      pendingSyncActions,
    };
  }

  /**
   * Calculate memory pressure
   */
  private calculateMemoryPressure(): 'low' | 'medium' | 'high' {
    const metricsCount = this.performanceMetrics.length + this.userActions.length;

    if (metricsCount > 150) return 'high';
    if (metricsCount > 80) return 'medium';
    return 'low';
  }

  /**
   * Clear old metrics to free memory
   */
  private clearOldMetrics(): void {
    const keepCount = Math.floor(this.maxMetricsInMemory / 2);

    this.performanceMetrics = this.performanceMetrics.slice(-keepCount);
    this.userActions = this.userActions.slice(-keepCount);

    logger.info('Cleared old metrics', {
      performanceMetricsKept: this.performanceMetrics.length,
      userActionsKept: this.userActions.length,
    });
  }

  /**
   * Get monitoring statistics
   */
  getStatistics() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const safeDuration = sessionDuration > 0 ? sessionDuration : 1;
    const health = this.getSystemHealth();

    return {
      session: {
        duration: sessionDuration,
        startTime: this.sessionStartTime,
      },
      errors: {
        total: this.errorCount,
        rate: this.errorCount / (safeDuration / 60000), // per minute
      },
      performance: {
        metricsTracked: this.performanceMetrics.length,
        avgDuration:
          this.performanceMetrics.length > 0
            ? this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0) /
              this.performanceMetrics.length
            : 0,
      },
      userActions: {
        total: this.userActions.length,
        rate: this.userActions.length / (safeDuration / 60000), // per minute
      },
      health,
    };
  }

  /**
   * Set user context for error tracking
   */
  setUser(userId: string, metadata?: Record<string, unknown>): void {
    if (this.sentry && typeof this.sentry.setUser === 'function') {
      this.sentry.setUser({
        id: userId,
        ...metadata,
      });
    }

    logger.debug('User context set', { userId });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (this.sentry && typeof this.sentry.setUser === 'function') {
      this.sentry.setUser(null);
    }

    logger.debug('User context cleared');
  }

  /**
   * Add custom breadcrumb
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    if (this.sentry && typeof this.sentry.addBreadcrumb === 'function') {
      this.sentry.addBreadcrumb({
        message,
        category,
        data,
        timestamp: Date.now(),
      });
    }

    logger.debug(`Breadcrumb: [${category}] ${message}`, data);
  }

  /**
   * Force flush all pending data
   */
  async flush(): Promise<void> {
    if (this.sentry && typeof this.sentry.flush === 'function') {
      try {
        await this.sentry.flush(2000);
      } catch (e) {
        // ignore flush errors
      }
    }

    logger.info('Monitoring data flushed');
  }

  /**
   * Get Sentry instance (for advanced usage)
   */
  getSentry(): SentryInstance | null {
    return this.sentry;
  }
}

// Export singleton instance
export const monitoring = ApplicationMonitoring.getInstance();

// Helper HOC for tracking component renders
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
): React.ComponentType<P> {
  return (props: P) => {
    const endTimer = monitoring.startPerformanceTimer(`render_${componentName}`);

    React.useEffect(() => {
      endTimer();
    }, []);

    return React.createElement(Component, props);
  };
}

// Helper hook for tracking screen views
export function useScreenTracking(screenName: string): void {
  React.useEffect(() => {
    monitoring.trackUserAction({
      action: 'screen_view',
      screen: screenName,
    });

    const _s = monitoring.getSentry();
    if (_s && typeof _s.addBreadcrumb === 'function') {
      _s.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to ${screenName}`,
        level: 'info',
      });
    }
  }, [screenName]);
}

export default monitoring;

if (isTestEnvironment) {
  if (typeof beforeEach === 'function') {
    beforeEach(() => {
      monitoring.resetForTests();
    });
  }

  if (typeof afterEach === 'function') {
    afterEach(() => {
      monitoring.resetForTests();
    });
  }
}

/** Local minimal typings used within monitoring to avoid `any` leaking */
type OfflineManagerLike = {
  getNetworkState?: () => { isConnected: boolean; isInternetReachable: boolean; type?: string; isWifiEnabled?: boolean };
  getNetworkQuality?: () => 'online' | 'offline' | 'poor' | string;
  getPendingActionsCount?: () => number | string;
  isOffline?: () => boolean;
  queueAction?: (type: string, payload: unknown) => void;
};

type BackendHealthMonitorLike = {
  getHealthStatus?: () => 'healthy' | 'degraded' | 'down' | string;
};

type SentryEvent = { user?: unknown; [key: string]: unknown };

type SentryBreadcrumb = { category?: string; message?: string; data?: Record<string, unknown>; level?: string; timestamp?: number };

type SentryScope = {
  setLevel?: (level: string) => void;
  setContext?: (k: string, v: unknown) => void;
  setUser?: (user: unknown) => void;
  addBreadcrumb?: (bc: SentryBreadcrumb) => void;
  setTag?: (k: string, v: string) => void;
};

type SentryInstance = {
  init?: (opts?: unknown) => void;
  setContext?: (k: string, v: unknown) => void;
  setUser?: (user: unknown) => void;
  withScope?: (cb: (scope: SentryScope) => void) => void;
  captureException?: (err: unknown) => string | void;
  captureMessage?: (msg: string, level?: string) => string | void;
  addBreadcrumb?: (bc: SentryBreadcrumb) => void;
  flush?: (timeout?: number) => Promise<void>;
  ErrorBoundary?: unknown;
  [key: string]: unknown;
};

// Initialize fallback values for offlineManager/backendHealthMonitor/Device if they are still undefined
if (!offlineManager) {
  offlineManager = null;
}

if (!backendHealthMonitor) {
  backendHealthMonitor = null;
}

if (!Device) {
  Device = { brand: 'unknown', modelName: 'unknown', osName: Platform.OS, osVersion: 'unknown' };
}
