import { Platform } from 'react-native';
import Config from './config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: unknown;
  stack?: string;
};

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private minLevel = Config.isDev ? LogLevel.DEBUG : LogLevel.INFO;

  private formatMessage(level: LogLevel, message: string, context?: unknown): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    // If context is an object with a `context` string property, show it as a short tag
    let contextTag = '';
    if (context && typeof context === 'object' && (context as any).context) {
      contextTag = String((context as any).context);
    }
    const contextStr = contextTag ? ` [${contextTag}] ` : context ? ` ${JSON.stringify(context)}` : ' ';
    return `[${timestamp}] ${levelStr}:${contextStr}${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private addLog(level: LogLevel, message: string, context?: unknown, error?: Error) {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      stack: error?.stack,
    };

    this.logs.push(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (Config.isDev) {
      const formattedMessage = this.formatMessage(level, message, context);

      // eslint-disable-next-line no-console -- Logger implementation requires console
      switch (level) {
        case LogLevel.DEBUG:
          console.log(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, error);
          break;
      }
    }

    // Send to crash reporting service in production
    if (Config.isProduction && level >= LogLevel.ERROR) {
      this.sendToCrashReporting(logEntry, error);
    }
  }

  private async sendToCrashReporting(logEntry: LogEntry, error?: Error) {
    try {
      // Send errors to Sentry in production
      const Sentry = require('@sentry/react-native');

      if (error) {
        // Capture exception with context
        Sentry.captureException(error, {
          level: logEntry.level >= LogLevel.ERROR ? 'error' : 'warning',
          contexts: {
            log: {
              message: logEntry.message,
              timestamp: logEntry.timestamp,
              context: logEntry.context,
            },
          },
          tags: {
            log_level: LogLevel[logEntry.level],
          },
        });
      } else {
        // Capture message for errors without exception objects
        Sentry.captureMessage(logEntry.message, {
          level: 'error',
          contexts: {
            log: {
              timestamp: logEntry.timestamp,
              context: logEntry.context,
            },
          },
        });
      }
    } catch (e) {
      // Fallback to console if Sentry fails
      // eslint-disable-next-line no-console -- Fallback when crash reporting fails
      console.error('Failed to send crash report:', e);
      // eslint-disable-next-line no-console -- Fallback when crash reporting fails
      console.error('Original error:', logEntry, error);
    }
  }

  debug(message: string, context?: unknown) {
    this.addLog(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: unknown) {
    this.addLog(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: unknown) {
    this.addLog(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: unknown) {
    this.addLog(LogLevel.ERROR, message, context, error);
  }

  time(label: string) {
    // eslint-disable-next-line no-console -- Performance timing in development
    if (Config.isDev) console.time(label);
  }

  timeEnd(label: string) {
    // eslint-disable-next-line no-console -- Performance timing in development
    if (Config.isDev) console.timeEnd(label);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) return this.logs.filter((l) => l.level >= level);
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return this.logs
      .map((log) => this.formatMessage(log.level, log.message, log.context))
      .join('\n');
  }
}

export const logger = new Logger();

export const log = {
  debug: (message: string, context?: unknown) => logger.debug(message, context),
  info: (message: string, context?: unknown) => logger.info(message, context),
  warn: (message: string, context?: unknown) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: unknown) => logger.error(message, error, context),
  time: (label: string) => logger.time(label),
  timeEnd: (label: string) => logger.timeEnd(label),
};

// Safe global error handler setup (only when ErrorUtils exists)
if ((global as any).ErrorUtils && Platform.OS !== 'web') {
  const errUtils = (global as any).ErrorUtils;
  const originalHandler =
    typeof errUtils.getGlobalHandler === 'function' ? errUtils.getGlobalHandler() : undefined;

  if (typeof errUtils.setGlobalHandler === 'function') {
    try {
      errUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        logger.error(`Global ${isFatal ? 'Fatal' : 'Non-Fatal'} Error`, error, {
          isFatal,
          stack: error?.stack,
        });
        if (typeof originalHandler === 'function') {
          try {
            originalHandler(error, isFatal);
          } catch (_) {
            // ignore
          }
        }
      });
    } catch (e) {
      // ignore in environments where ErrorUtils behaves differently
    }
  }
}

export default logger;
